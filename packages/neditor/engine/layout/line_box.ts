// The rectangular area that contains the boxes that form a line is called
// a line box.
//   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
//
// Note that the line box is not an actual box. To maintain consistency, we
// follow the nomenclature of CSS 2.1 specification. But we do not derive
// |LineBox| from |Box| because, despite the name, a line box is much closer
// to block and inline formatting contexts than to a box.
//
// A line box is a short-lived object that is constructed and destroyed during
// the layout. It does not own child boxes nor trigger their layout, which is a
// responsibility of the box that establishes this formatting context. This
// class merely knows how to determine which children to include on the line,
// where to wrap those children, and how to calculate the positions of those
// children.
//
// Due to bidirectional reordering and the horizontal and vertical alignment,
// used values of "left" and "top" can only be calculated when the line ends. To
// ensure that the line box has completed all calculations, |EndUpdates| must be
// called.
import { LayoutUnit } from './layout_unit';
import { FontMetrics } from '../render_tree/font';
import { PropertyValue } from '../cssom/property_value';
import { Box, LayoutParams } from './box';
import { BaseDirection } from './base_direction';
import { Optional } from '@neditor/core/base/common/typescript';
import { Vector2dF } from '../math/vector2d_f';
import { WrapAtPolicy, WrapOpportunityPolicy, WrapResult } from './line_wrapping';
import { DCHECK } from '@neditor/core/base/check';
import { isNil } from '@neditor/core/base/common/type';
import { KeywordValue } from '../cssom/keyword_value';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { UsedLineHeightProvider } from './used_style';

export enum HorizontalAlignment {
  kLeftHorizontalAlignment,
  kCenterHorizontalAlignment,
  kRightHorizontalAlignment,
};

type ChildBoxes = Box[]

export class LineBox {
  static id = 1;
  id = LineBox.id++;
  top_: LayoutUnit;
  position_children_relative_to_baseline_: boolean;
  line_height_: PropertyValue;
  font_metrics_: FontMetrics;
  should_collapse_leading_white_space_: boolean;
  should_collapse_trailing_white_space_: boolean;
  layout_params_: LayoutParams;
  base_direction_: BaseDirection;
  text_align_: PropertyValue;
  font_size_: PropertyValue;
  indent_offset_: LayoutUnit;
  ellipsis_width_: LayoutUnit;
  text_path_: PropertyValue;

  has_overflowed_: boolean;
  at_end_: boolean;

  // Non-owned list of child boxes.
  //
  // Horizontal and vertical alignments make it impossible to calculate
  // positions of children before all children are known.

  child_boxes_: ChildBoxes = [];

  num_absolutely_positioned_boxes_before_first_box_justifying_line_: number;

  // Accessing boxes indicated by these indices are only valid before
  // EndUpdates() is called, because the positions of the boxes may change
  // during bidirectional sorting.
  first_box_justifying_line_existence_index_: Optional<number>;
  first_non_collapsed_child_box_index_: Optional<number>;
  last_non_collapsed_child_box_index_: Optional<number>;

  // These flags are set when EndUpdates() is called. This allows the leading
  // and trailing white space state of the line to be accessible even after
  // the boxes have been moved as a result of bidirectional sorting.
  has_leading_white_space_ = false;
  has_trailing_white_space_ = false;

  shrink_to_fit_width_: LayoutUnit;
  height_: LayoutUnit;
  baseline_offset_from_top_: LayoutUnit;

  is_ellipsis_placed_: boolean;
  placed_ellipsis_offset_: LayoutUnit;
  constructor(
    top: LayoutUnit,
    position_children_relative_to_baseline: boolean,
    line_height: PropertyValue,
    font_metrics: FontMetrics,
    should_collapse_leading_white_space: boolean,
    should_collapse_trailing_white_space: boolean,
    layout_params: LayoutParams,
    base_direction: BaseDirection,
    text_align: PropertyValue,
    font_size: PropertyValue,
    indent_offset: LayoutUnit,
    ellipsis_width: LayoutUnit,
    text_path: PropertyValue,
    private set_glyph_offset: (val: LayoutUnit) => void,
    private get_glyph_offset: () => LayoutUnit
  ) {
    this.top_ = top;
    this.position_children_relative_to_baseline_ =
      position_children_relative_to_baseline;
    this.line_height_ = line_height;
    this.font_metrics_ = font_metrics;
    this.should_collapse_leading_white_space_ = should_collapse_leading_white_space;
    this.should_collapse_trailing_white_space_ =
      should_collapse_trailing_white_space;
    this.layout_params_ = layout_params;
    this.base_direction_ = base_direction;
    this.text_align_ = text_align;
    this.font_size_ = font_size;
    this.indent_offset_ = indent_offset;
    this.ellipsis_width_ = ellipsis_width;
    this.text_path_ = text_path;
    this.has_overflowed_ = false;
    this.at_end_ = false;
    this.num_absolutely_positioned_boxes_before_first_box_justifying_line_ = 0;
    this.shrink_to_fit_width_ = this.indent_offset_.CLONE();
    this.height_ = new LayoutUnit();
    this.baseline_offset_from_top_ = new LayoutUnit();
    this.is_ellipsis_placed_ = false;
    this.placed_ellipsis_offset_ = new LayoutUnit();
  }

  top() {
    return this.top_;
  }

  // Attempt to add the child box to the line, which may cause a line wrap to
  // occur if the box overflows the line and a usable wrap location is available
  // among the child boxes. When this occurs, a box is returned. This signifies
  // the last child box included on the line before the wrap and can be the
  // current child box or any previously added one. All boxes that were
  // previously added after the returned box must be re-inserted, as they were
  // not successfully placed on the line.
  //
  // The returned box can potentially be split as a result of the line wrap, in
  // which case, the portion after the split will be accessible via the child
  // box's |GetSplitSibling| call. This split sibling should be the first box
  // added the next time |TryAddChildAndMaybeWrap| is called, followed by any
  // additional child boxes that were not placed on the line.
  //
  // This call asynchronously calculates the positions and sizes of the added
  // child boxes. The used values will be undefined until |EndUpdates| is
  // called.
  TryAddChildAndMaybeWrap(child_box: Box): Optional<Box> {
    DCHECK(!this.at_end_);

    if (child_box.IsAbsolutelyPositioned()) {
      this.BeginEstimateStaticPositionForAbsolutelyPositionedChild(child_box);
      return undefined;
    }

    this.UpdateSizePreservingTrailingWhiteSpace(child_box);

    // If the line box hasn't already overflowed the line, then attempt to add it
    // within the available width.
    if (!this.has_overflowed_ && !this.TryAddChildWithinAvailableWidth(child_box)) {
      // If the attempt failed, then adding the full box would overflow the line.
      // Attempt to find a wrap location within the available width, which will
      // prevent overflow from occurring. The priority is as follows:
      // 1. Attempt to find the last normal wrap opportunity in the current child
      //    within the available width.
      // 2. Attempt to find the last normal wrap opportunity within the previously
      //    added children.
      // 3. Attempt to find the last break-word wrap opportunity position in the
      //    current child within the available width. This will only be attempted
      //    when the overflow-wrap style of the box is break-word.
      // 4. Attempt to find the last break-word wrap opportunity within the
      //    previously added children. This will only be attempted when the
      //    overflow-wrap style of the box is break-word.
      // https://www.w3.org/TR/css-text-3/#line-breaking
      // https://www.w3.org/TR/css-text-3/#overflow-wrap
      if (
        this.TryWrapOverflowingBoxAndMaybeAddSplitChild(WrapAtPolicy.kWrapAtPolicyLastOpportunityWithinWidth, WrapOpportunityPolicy.kWrapOpportunityPolicyNormal, child_box)
        || this.TryWrapChildrenAtLastOpportunity(WrapOpportunityPolicy.kWrapOpportunityPolicyNormal)
        || this.TryWrapOverflowingBoxAndMaybeAddSplitChild(WrapAtPolicy.kWrapAtPolicyLastOpportunityWithinWidth, WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWord, child_box)
        || this.TryWrapChildrenAtLastOpportunity(WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWord)
      ) {
        // A wrap position was successfully found within the width. The line is
        // wrapping and at its end.
        this.at_end_ = true;
      } else {
        // If an inline box cannot be split (e.g., if the inline box contains
        // a single character, or language specific word breaking rules disallow
        // a break within the inline box), then the inline box overflows the line
        // box.
        //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
        this.has_overflowed_ = true;
      }
    }

    if (this.has_overflowed_) {
      // If the line has overflowed, then the first wrap opportunity within the
      // child box is preferred, thereby minimizing the size of the overflow. This
      // can be either a break-word or normal wrap, depending on the overflow-wrap
      // style of the box.
      // https://www.w3.org/TR/css-text-3/#overflow-wrap
      if (this.TryWrapOverflowingBoxAndMaybeAddSplitChild(WrapAtPolicy.kWrapAtPolicyFirstOpportunity, WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWordOrNormal, child_box)) {
        // A wrap position was successfully found. The line is wrapping and at its
        // end.
        this.at_end_ = true;
      } else {
        // No wrap position was found within the child box. The box is allowed to
        // overflow the line and additional boxes can be added until a wrappable
        // box is found.
        this.BeginAddChildInternal(child_box);
      }
    }

    DCHECK(this.child_boxes_.length);
    return this.at_end_ ? this.child_boxes_[this.child_boxes_.length - 1] : undefined;
  }
  // Asynchronously adds the given child box to the line, ignoring any possible
  // overflow. The used values will be undefined until |EndUpdates| is called.
  BeginAddChildAndMaybeOverflow(child_box: Box) {
    if (child_box.IsAbsolutelyPositioned()) {
      this.BeginEstimateStaticPositionForAbsolutelyPositionedChild(child_box);
      return;
    }
    this.UpdateSizePreservingTrailingWhiteSpace(child_box);
    this.BeginAddChildInternal(child_box);
  }
  // Ensures that the calculation of used values for all previously seen child
  // boxes is completed.
  EndUpdates() {
    this.at_end_ = true;

    // A sequence of collapsible spaces at the end of a line is removed.
    //   https://www.w3.org/TR/css3-text/#white-space-phase-2
    if (this.should_collapse_trailing_white_space_) {
      this.CollapseTrailingWhiteSpace();
    }

    // Set the leading and trailing white space flags now. This ensures that the
    // values returned by HasLeadingWhiteSpace() and HasTrailingWhiteSpace()
    // remain valid even after bidi reversals.
    this.has_leading_white_space_ = this.HasLeadingWhiteSpace();
    this.has_trailing_white_space_ = this.HasTrailingWhiteSpace();

    this.ReverseChildBoxesByBidiLevels();
    this.UpdateChildBoxLeftPositions();
    this.SetLineBoxHeightFromChildBoxes();
    this.UpdateChildBoxTopPositions();
    this.MaybePlaceEllipsis();
  }

  // WARNING: All public methods below may be called only after |EndUpdates|.

  // Whether the line starts with a white space.
  HasLeadingWhiteSpace(): boolean {
    // |has_leading_white_space_| should only ever be set by EndUpdates() after
    // |at_end_| has been set to true;
    DCHECK(this.at_end_ || !this.has_leading_white_space_);

    // If |has_leading_white_space_| has been set, then use it. Otherwise, grab
    // the leading white space state from the first non-collapsed child box.
    return this.has_leading_white_space_
      ? !!this.has_leading_white_space_
      : !!this.first_non_collapsed_child_box_index_ &&
      this.child_boxes_[this.first_non_collapsed_child_box_index_].HasLeadingWhiteSpace();
  }
  // Whether the line ends with a white space.
  HasTrailingWhiteSpace(): boolean {
    // |has_trailing_white_space_| should only ever be set by EndUpdates() after
    // |at_end_| has been set to true;
    DCHECK(this.at_end_ || !this.has_trailing_white_space_);

    // If |has_trailing_white_space_| has been set, then use it. Otherwise, grab
    // the trailing white space state from the last non-collapsed child box.
    return this.has_trailing_white_space_
      ? !!this.has_trailing_white_space_
      : !!this.last_non_collapsed_child_box_index_ &&
      this.child_boxes_[this.last_non_collapsed_child_box_index_].HasTrailingWhiteSpace();
  }
  // Whether all boxes on the line are collapsed.
  IsCollapsed(): boolean {
    return !this.first_non_collapsed_child_box_index_;
  }

  // Line boxes that contain no text, no preserved white space, no inline
  // elements with non-zero margins, padding, or borders, and no other in-flow
  // content must be treated as zero-height line boxes for the purposes
  // of determining the positions of any elements inside of them, and must be
  // treated as not existing for any other purpose.
  //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
  LineExists(): boolean {
    return !isNil(this.first_box_justifying_line_existence_index_);
  }
  // Returns the first box justifing the line's existence.
  // NOTE: This includes absolutely positioned children.
  GetFirstBoxJustifyingLineExistenceIndex(): number {
    return (isNil(this.first_box_justifying_line_existence_index_) ?
        this.child_boxes_.length : this.first_box_justifying_line_existence_index_) +
      this.num_absolutely_positioned_boxes_before_first_box_justifying_line_;
  }

  IsEllipsisPlaced(): boolean {
    return this.is_ellipsis_placed_;
  }
  GetEllipsisCoordinates(): Vector2dF {
    return new Vector2dF(this.placed_ellipsis_offset_.toFloat(),
      (this.top_.ADD(this.baseline_offset_from_top_)).toFloat());
  }

  // Used to calculate the width of an inline container box.
  shrink_to_fit_width() {
    return this.shrink_to_fit_width_;
  }

  // Used to calculate the "auto" height of the box that establishes this
  // formatting context.
  height() {
    return this.height_;
  }

  // Returns the vertical offset of the baseline from the top of the line box.
  // May return non-zero values even for empty line boxes, because of the strut.
  //   https://www.w3.org/TR/CSS21/visudet.html#strut
  baseline_offset_from_top() {
    return this.baseline_offset_from_top_;
  }

  GetAvailableWidth(): LayoutUnit {
    if (this.text_path_.EQ(KeywordValue.GetNone())) {
      return this.layout_params_.containing_block_size.width().SUB(this.shrink_to_fit_width_);
    }
    DCHECK(this.text_path_.IsPathValue());
    return this.text_path_.lengthUnit.SUB(this.shrink_to_fit_width_);
  }
  UpdateSizePreservingTrailingWhiteSpace(child_box: Box) {
    child_box.SetShouldCollapseLeadingWhiteSpace(
      this.ShouldCollapseLeadingWhiteSpaceInNextChildBox());
    child_box.SetShouldCollapseTrailingWhiteSpace(false);
    if (child_box.isInlineContainerBox()) {
      child_box.SetGlyphOffset(this.get_glyph_offset());
    }
    if (child_box.isTextBox()) {
      child_box.SetGlyphOffset(this.get_glyph_offset());
    }
    child_box.UpdateSize(this.layout_params_);
  }
  ShouldCollapseLeadingWhiteSpaceInNextChildBox(): boolean {
    return this.last_non_collapsed_child_box_index_
      // Any space immediately following another collapsible space - even
      // one outside the boundary of the inline containing that space,
      // provided they are both within the same inline formatting context
      // - is collapsed.
      //   https://www.w3.org/TR/css3-text/#white-space-phase-1
      ? this.child_boxes_[this.last_non_collapsed_child_box_index_].HasTrailingWhiteSpace()
      // A sequence of collapsible spaces at the beginning of a line is
      // removed.
      //   https://www.w3.org/TR/css3-text/#white-space-phase-2
      : this.should_collapse_leading_white_space_;
  }
  CollapseTrailingWhiteSpace() {
    if (!this.HasTrailingWhiteSpace()) {
      return;
    }

    // A white space between child boxes is already collapsed as a result
    // of calling |UpdateSizePreservingTrailingWhiteSpace|. Collapse the
    // trailing white space in the last non-collapsed child box (all fully
    // collapsed child boxes at the end of the line are treated as
    // non-existent for the purposes of collapsing).
    if (isNil(this.last_non_collapsed_child_box_index_)) {
      NOTREACHED();
    }
    let last_non_collapsed_child_box =
      this.child_boxes_[this.last_non_collapsed_child_box_index_];
    let child_box_pre_collapse_width =
      last_non_collapsed_child_box.width();
    last_non_collapsed_child_box.SetShouldCollapseTrailingWhiteSpace(true);
    last_non_collapsed_child_box.UpdateSize(this.layout_params_);
    let collapsed_white_space_width =
      child_box_pre_collapse_width.SUB(last_non_collapsed_child_box.width());

    this.shrink_to_fit_width_.SUB_ASSIGN(collapsed_white_space_width);
  }
  RestoreTrailingWhiteSpace() {
    if (!this.last_non_collapsed_child_box_index_) {
      return;
    }
    let last_non_collapsed_child_box =
      this.child_boxes_[this.last_non_collapsed_child_box_index_];
    let child_box_pre_restore_width =
      last_non_collapsed_child_box.width();
    last_non_collapsed_child_box.SetShouldCollapseTrailingWhiteSpace(false);
    last_non_collapsed_child_box.UpdateSize(this.layout_params_);
    let restored_white_space_width =
      last_non_collapsed_child_box.width().SUB(child_box_pre_restore_width);

    this.shrink_to_fit_width_.ADD_ASSIGN(restored_white_space_width);
  }

  TryAddChildWithinAvailableWidth(child_box: Box): boolean {
    // Horizontal margins, borders, and padding are respected between boxes.
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
    // If the box fits within the available width, simply add it. Nothing more
    // needs to be done.
    if (child_box.GetMarginBoxWidth().LE(this.GetAvailableWidth())) {
      this.BeginAddChildInternal(child_box);
      return true;
    }

    // Otherwise, the box currently does not fit, but if there is trailing
    // whitespace that can be collapsed, then one more attempt must be made to fit
    // the box within the available width.
    if (this.should_collapse_trailing_white_space_ &&
      (child_box.HasTrailingWhiteSpace() ||
        (child_box.IsCollapsed() && this.HasTrailingWhiteSpace()))) {
      let child_has_trailing_white_space = child_box.HasTrailingWhiteSpace();
      let child_fits_after_collapsing_trailing_whitespace = false;

      // A sequence of collapsible spaces at the end of a line is removed.
      //   https://www.w3.org/TR/css3-text/#white-space-phase-2
      if (child_has_trailing_white_space) {
        child_box.SetShouldCollapseTrailingWhiteSpace(true);
        child_box.UpdateSize(this.layout_params_);
      } else {
        this.CollapseTrailingWhiteSpace();
      }

      // Check to see if the box now fits, as the white space collapsing may have
      // freed up enough space for it.
      if (child_box.GetMarginBoxWidth().LE(this.GetAvailableWidth())) {
        child_fits_after_collapsing_trailing_whitespace = true;
      }

      // Restore the collapsed trailing whitespace now that the space check is
      // complete.
      if (child_has_trailing_white_space) {
        child_box.SetShouldCollapseTrailingWhiteSpace(false);
        child_box.UpdateSize(this.layout_params_);
      } else {
        this.RestoreTrailingWhiteSpace();
      }

      // If there is enough space to add the child without overflowing the line,
      // add it now. This does not end the line, as more boxes may be able to fit
      // as well.
      if (child_fits_after_collapsing_trailing_whitespace) {
        this.BeginAddChildInternal(child_box);
        return true;
      }
    }

    // The child did not fit within the available width.
    return false;
  }
  TryWrapOverflowingBoxAndMaybeAddSplitChild(
    wrap_at_policy: WrapAtPolicy,
    wrap_opportunity_policy: WrapOpportunityPolicy, child_box: Box): boolean {
    // If none of the children justify the line's existence, then wrapping is
    // unavailable. The wrap can't happen before the first child justifying the
    // line.
    if (!this.first_box_justifying_line_existence_index_ &&
      !child_box.JustifiesLineExistence()) {
      return false;
    }

    // Attempt to wrap the child based upon the passed in wrap policy.
    let wrap_result = child_box.TryWrapAt(
      wrap_at_policy, wrap_opportunity_policy, this.LineExists(),
      this.GetAvailableWidth(), this.should_collapse_trailing_white_space_);
    // If the wrap is occurring before the box, then simply return that a wrap
    // occurred. This box is not being included within this line and does not need
    // to be added. The line ends with the box before this one.
    if (wrap_result == WrapResult.kWrapResultWrapBefore) {
      return true;
      // Otherwise, if a split wrap occurred, then the wrap location was found
      // within the box and the box was split. The first part of the box needs to
      // be added to the line. It is the last box included on this line. The
      // second part of the box will be the first box included on the next line.
    } else if (wrap_result == WrapResult.kWrapResultSplitWrap) {
      // The portion of the child box being added needs to be re-measured prior to
      // being added because the split invalidated its size.
      this.UpdateSizePreservingTrailingWhiteSpace(child_box);
      this.BeginAddChildInternal(child_box);

      // TODO: Enable this logic.
      // if (wrap_opportunity_policy == kWrapAtPolicyLastOpportunityWithinWidth) {
      // If trailing white space is being collapsed, then the child box can
      // exceed the available width prior to white space being collapsed. So the
      // DCHECK is only valid if the box's whitespace is collapsed prior to it.
      //   if (should_collapse_trailing_white_space_) {
      //     CollapseTrailingWhiteSpace();
      //   }
      //   DCHECK(child_box->GetMarginBoxWidth() <= available_width);
      // }

      return true;
      // Otherwise, no wrap location was found within the box.
    } else {
      return false;
    }
  }
  TryWrapChildrenAtLastOpportunity(
    wrap_opportunity_policy: WrapOpportunityPolicy): boolean {
    // If none of the children justify the line's existence, then wrapping is
    // unavailable. The wrap can't happen before the first child justifying the
    // line.
    if (!this.first_box_justifying_line_existence_index_) {
      return false;
    }

    let total_wrap_width = new LayoutUnit();

    // Walk the children in reverse order, since the last available wrap is
    // preferred over earlier ones. However, do not attempt any children preceding
    // the line justification index, as they are guaranteed to not be wrappable.
    let wrap_index = this.child_boxes_.length;
    let line_justification_index = this.first_box_justifying_line_existence_index_;
    while (wrap_index > line_justification_index) {
      --wrap_index;
      let child_box = this.child_boxes_[wrap_index];

      total_wrap_width.ADD_ASSIGN(child_box.GetMarginBoxWidth());

      // Check to see if the line existence is already justified prior to this
      // box. This will be the case if this isn't first box justifying the
      // line's existence. If this is the first box justifying the line's
      // existence, then justification occurs somewhere within this box.
      let is_line_existence_already_justified =
        wrap_index != line_justification_index;

      // Attempt to wrap within the child. Width is not taken into account, as
      // the last wrappable location is always preferred, regardless of width.
      let wrap_result = child_box.TryWrapAt(
        WrapAtPolicy.kWrapAtPolicyLastOpportunity, wrap_opportunity_policy,
        is_line_existence_already_justified, new LayoutUnit(), false);
      if (wrap_result != WrapResult.kWrapResultNoWrap) {
        // If a wrap was successfully found, then the line needs to be updated to
        // reflect that some of the previously added children are no longer being
        // fully included on the line.

        // Remove the wrap box and all subsequent boxes from the children, and
        // subtract their width from the line. In the case where this is a split
        // wrap, the portion of the split box being retained on the line will be
        // re-added after its width is recalculated below.
        this.child_boxes_.length = wrap_index;
        this.shrink_to_fit_width_.SUB_ASSIGN(total_wrap_width);

        // Update the non-collapsed indices to account for the boxes removed from
        // the line.
        if (this.first_non_collapsed_child_box_index_) {
          if (this.first_non_collapsed_child_box_index_ >= wrap_index) {
            this.first_non_collapsed_child_box_index_ = undefined;
            this.last_non_collapsed_child_box_index_ = undefined;
          } else if (this.last_non_collapsed_child_box_index_! >= wrap_index) {
            this.last_non_collapsed_child_box_index_ =
              this.first_non_collapsed_child_box_index_;
            let check_index = wrap_index;
            let last_check_index = this.last_non_collapsed_child_box_index_ + 1;
            while (check_index > last_check_index) {
              --check_index;
              if (this.child_boxes_[check_index].IsCollapsed()) {
                this.last_non_collapsed_child_box_index_ = check_index;
                break;
              }
            }
          }
        }

        if (wrap_result == WrapResult.kWrapResultSplitWrap) {
          // If a split occurs, then the portion of the child box being added
          // needs to be re-measured prior to being added, as the split
          // invalidated the box's size.
          this.UpdateSizePreservingTrailingWhiteSpace(child_box);
          this.BeginAddChildInternal(child_box);
        }

        return true;
      }
    }

    return false;
  }

  // Asynchronously estimates the static position of the given child box.
  // In CSS 2.1 the static position is only defined for absolutely positioned
  // boxes. The used values will be undefined until |EndUpdates| is called.
  BeginEstimateStaticPositionForAbsolutelyPositionedChild(child_box: Box) {
    if (!this.first_box_justifying_line_existence_index_) {
      ++this.num_absolutely_positioned_boxes_before_first_box_justifying_line_;
    }

    // The term "static position" (of an element) refers, roughly, to the position
    // an element would have had in the normal flow. More precisely:
    //
    // The static-position containing block is the containing block of a
    // hypothetical box that would have been the first box of the element if its
    // specified 'position' value had been 'static'.

    // The static position for 'left' is the distance from the left edge of the
    // containing block to the left margin edge of a hypothetical box that would
    // have been the first box of the element if its 'position' property had been
    // 'static' and 'float' had been 'none'. The value is negative if the
    // hypothetical box is to the left of the containing block.
    //   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width

    // The static position for 'right' is the distance from the right edge of the
    // containing block to the right margin edge of the same hypothetical box as
    // above. The value is positive if the hypothetical box is to the left of the
    // containing block's edge.
    //   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width

    // For the purposes of this section and the next, the term "static position"
    // (of an element) refers, roughly, to the position an element would have had
    // in the normal flow. More precisely, the static position for 'top' is the
    // distance from the top edge of the containing block to the top margin edge
    // of a hypothetical box that would have been the first box of the element if
    // its specified 'position' value had been 'static'.
    //   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-height

    if (child_box.is_inline_before_blockification()) {
      this.CollapseTrailingWhiteSpace();
      child_box.SetStaticPositionLeftFromParent(this.shrink_to_fit_width_);
      this.RestoreTrailingWhiteSpace();
    } else {
      child_box.SetStaticPositionLeftFromParent(new LayoutUnit());
    }
    child_box.SetStaticPositionRightFromParent(new LayoutUnit());
    child_box.SetStaticPositionTopFromParent(new LayoutUnit());
  }

  BeginAddChildInternal(child_box: Box) {
    if (!this.first_box_justifying_line_existence_index_ &&
      child_box.JustifiesLineExistence()) {
      this.first_box_justifying_line_existence_index_ = this.child_boxes_.length;
    }

    if (!child_box.IsCollapsed()) {
      if (!this.first_non_collapsed_child_box_index_) {
        this.first_non_collapsed_child_box_index_ = this.child_boxes_.length;
      }
      this.last_non_collapsed_child_box_index_ = this.child_boxes_.length;
    }

    // If this child has a trailing line break, then we've reached the end of this
    // line. Nothing more can be added to it.
    if (child_box.HasTrailingLineBreak()) {
      this.at_end_ = true;
    }

    // Horizontal margins, borders, and padding are respected between boxes.
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
    this.shrink_to_fit_width_.ADD_ASSIGN(child_box.GetMarginBoxWidth());
    this.set_glyph_offset(this.shrink_to_fit_width_.CLONE());

    this.child_boxes_.push(child_box);
  }

  ReverseChildBoxesByBidiLevels() {
    // From the highest level found in the text to the lowest odd level on each
    // line, including intermediate levels not actually present in the text,
    // reverse any contiguous sequence of characters that are at that level or
    // higher.
    //  http://unicode.org/reports/tr9/#L2
    let kInvalidLevel = -1;
    let max_level = 0;
    let min_level = Number.MAX_SAFE_INTEGER;

    for (let child_box of this.child_boxes_) {

      let child_level = child_box.GetBidiLevel() || kInvalidLevel;
      if (child_level != kInvalidLevel) {
        if (child_level > max_level) {
          max_level = child_level;
        }
        if (child_level < min_level) {
          min_level = child_level;
        }
      }
    }

    // Reversals only occur down to the lowest odd level.
    if (min_level % 2 == 0) {
      min_level += 1;
    }

    for (let i = max_level; i >= min_level; --i) {
      this.ReverseChildBoxesMeetingBidiLevelThreshold(i);
    }
  }
  ReverseChildBoxesMeetingBidiLevelThreshold(level: number) {
    // Walk all of the boxes in the line, looking for runs of boxes that have a
    // bidi level greater than or equal to the passed in level. Every run of two
    // or more boxes is reversed.
    let run_count = 0;
    let run_start: Box;
    let child_level = 0;

    for (let child_box_iterator = 0;
         child_box_iterator != this.child_boxes_.length - 1 - 1;) {
      let current_iterator = child_box_iterator++;
      let child_box = this.child_boxes_[current_iterator];

      child_level = child_box.GetBidiLevel() || child_level;

      // The child's level is greater than or equal to the required level, so it
      // qualifies for reversal.
      if (child_level >= level) {
        if (run_count == 0) {
          run_start = this.child_boxes_[current_iterator];
        }
        ++run_count;
        // The child's level didn't qualify it for reversal. If there was an
        // active run, it has ended, so reverse it.
      } else {
        if (run_count > 1) {
          let tmp = run_start!;
          run_start = this.child_boxes_[current_iterator];
          this.child_boxes_[current_iterator] = tmp;
        }
        run_count = 0;
      }
    }

    // A qualifying run was found that ran through the end of the children.
    // Reverse it.
    if (run_count > 1) {
      let tmp = run_start!;
      run_start = this.child_boxes_[this.child_boxes_.length - 1];
      this.child_boxes_[this.child_boxes_.length - 1] = tmp;

    }
  }

  UpdateChildBoxLeftPositions() {
    let horizontal_offset = new LayoutUnit();

    // Determine the horizontal offset to apply to the child boxes from the
    // horizontal alignment.
    let horizontal_alignment = this.ComputeHorizontalAlignment();
    switch (horizontal_alignment) {
      case HorizontalAlignment.kLeftHorizontalAlignment:
        // The horizontal alignment is to the left, so no offset needs to be
        // applied based on the alignment. This places all of the available space
        // to the right of the boxes.
        break;
      case HorizontalAlignment.kCenterHorizontalAlignment:
        // The horizontal alignment is to the center, so offset by half of the
        // available width. This places half of the available width on each side
        // of the boxes.
        horizontal_offset = this.GetAvailableWidth().DIV(2);
        break;
      case HorizontalAlignment.kRightHorizontalAlignment:
        // The horizontal alignment is to the right, so offset by the full
        // available width. This places all of the available space to the left of
        // the boxes.
        horizontal_offset = this.GetAvailableWidth();
        break;
    }

    // Determine the horizontal offset to add to the child boxes from the indent
    // offset (https://www.w3.org/TR/CSS21/text.html#propdef-text-indent), which
    // is treated as a margin applied to the start edge of the line box. In the
    // case where the start edge is on the right, there is no offset to add, as
    // it was already included from the GetAvailableWidth() logic above.
    //
    // To add to this, the indent offset was added to |shrink_to_fit_width_| when
    // the line box was created. The above logic serves to subtract half of the
    // indent offset when the alignment is centered, and the full indent offset
    // when the alignment is to the right. Re-adding the indent offset in the case
    // where the base direction is LTR causes the indent to shift the boxes to the
    // right. Not adding it in the case where the base direction is RTL causes the
    // indent to shift the boxes to the left.
    //
    // Here are the 6 cases and the final indent offset they produce:
    // Left Align   + LTR => indent_offset
    // Center Align + LTR => indent_offset / 2
    // Right Align  + LTR => 0
    // Left Align   + RTL => 0
    // Center Align + RTL => -indent_offset / 2
    // Right Align  + RTL => -indent_offset
    if (this.base_direction_ != BaseDirection.kRightToLeftBaseDirection) {
      horizontal_offset.ADD_ASSIGN(this.indent_offset_);
    }

    // Set the first child box left position to the horizontal offset. This
    // results in all boxes being shifted by that offset.
    let child_box_left = new LayoutUnit(horizontal_offset);
    for (let child_box of this.child_boxes_) {
      child_box.set_left(child_box_left);
      child_box_left =
        child_box.GetMarginBoxRightEdgeOffsetFromContainingBlock();
    }
  }
  SetLineBoxHeightFromChildBoxes() {
    // The minimum height consists of a minimum height above the baseline and
    // a minimum depth below it, exactly as if each line box starts with
    // a zero-width inline box with the element's font and line height properties.
    // We call that imaginary box a "strut."
    //   https://www.w3.org/TR/CSS21/visudet.html#strut
    let used_line_height_provider = new UsedLineHeightProvider(this.font_metrics_, this.font_size_);
    this.line_height_.Accept(used_line_height_provider);

    this.baseline_offset_from_top_ =
      used_line_height_provider.baseline_offset_from_top();
    let baseline_offset_from_bottom =
      used_line_height_provider.baseline_offset_from_bottom();

    let max_top_aligned_height = new LayoutUnit();
    let max_bottom_aligned_height = new LayoutUnit();

    // During this loop, the line box height above and below the baseline is
    // established.
    for (let child_box of this.child_boxes_) {

      // The child box influence on the line box depends on the vertical-align
      // property.
      //   https://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align
      let vertical_align =
        child_box.computed_style()!.vertical_align;
      let baseline_offset_from_child_top_margin_edge = new LayoutUnit();
      let update_height = false;
      if (vertical_align == KeywordValue.GetMiddle()) {
        // Align the vertical midpoint of the box with the baseline of the parent
        // box plus half the x-height (height of the 'x' glyph) of the parent.
        baseline_offset_from_child_top_margin_edge =
          this.GetHeightAboveMiddleAlignmentPoint(child_box);
        update_height = true;
      } else if (vertical_align == KeywordValue.GetTop()) {
        // Align the top of the aligned subtree with the top of the line box.
        // That means it will never affect the height above the baseline, but it
        // may affect the height below the baseline if this is the tallest child
        // box. We measure the tallest top-aligned box to implement that after
        // this loop.
        let child_height = child_box.GetInlineLevelBoxHeight();
        // If there previously was a taller bottom-aligned box, then this box does
        // not influence the line box height or baseline.
        if (child_height > max_bottom_aligned_height) {
          max_top_aligned_height = LayoutUnit.Max(max_top_aligned_height, child_height);
        }
      } else if (vertical_align == KeywordValue.GetBottom()) {
        // Align the bottom of the aligned subtree with the bottom of the line
        // box.
        let child_height = child_box.GetInlineLevelBoxHeight();
        // If there previously was a taller top-aligned box, then this box does
        // not influence the line box height or baseline.
        if (child_height > max_top_aligned_height) {
          max_bottom_aligned_height =
            LayoutUnit.Max(max_bottom_aligned_height, child_height);
        }
      } else if (vertical_align == KeywordValue.GetBaseline()) {
        // Align the baseline of the box with the baseline of the parent box.
        baseline_offset_from_child_top_margin_edge =
          child_box.GetBaselineOffsetFromTopMarginEdge();
        update_height = true;
      } else {
        NOTREACHED('Unknown value of "vertical-align".');
      }

      if (update_height) {
        this.baseline_offset_from_top_ =
          LayoutUnit.Max(this.baseline_offset_from_top_,
            baseline_offset_from_child_top_margin_edge);

        let baseline_offset_from_child_bottom_margin_edge =
          child_box.GetInlineLevelBoxHeight().SUB(baseline_offset_from_child_top_margin_edge)
        ;
        baseline_offset_from_bottom =
          LayoutUnit.Max(baseline_offset_from_bottom,
            baseline_offset_from_child_bottom_margin_edge);
      }
    }
    // The line box height is the distance between the uppermost box top and the
    // lowermost box bottom.
    //   https://www.w3.org/TR/CSS21/visudet.html#line-height
    this.height_ = this.baseline_offset_from_top_.ADD(baseline_offset_from_bottom);

    // In case they are aligned 'top' or 'bottom', they must be aligned so as to
    // minimize the line box height. If such boxes are tall enough, there are
    // multiple solutions and CSS 2.1 does not define the position of the line
    // box's baseline.
    //   https://www.w3.org/TR/CSS21/visudet.html#line-height
    // For the cases where CSS 2.1 does not specify the baseline position, the
    // code below matches the behavior or WebKit and Blink.
    if (max_top_aligned_height < max_bottom_aligned_height) {
      if (max_top_aligned_height.GT(this.height_)) {
        // The bottom aligned box is tallest, but there should also be enough
        // space below the baseline for the shorter top aligned box.
        baseline_offset_from_bottom =
          max_top_aligned_height.SUB(this.baseline_offset_from_top_);
      }
      if (max_bottom_aligned_height.GT(this.height_)) {
        // Increase the line box height above the baseline to make the largest
        // bottom-aligned child box fit.
        this.height_ = max_bottom_aligned_height;
        this.baseline_offset_from_top_ = this.height_.SUB(baseline_offset_from_bottom);
      }
    } else {
      if (max_bottom_aligned_height.GT(this.height_)) {
        // The top aligned box is tallest, but there should also be enough
        // space above the baseline for the shorter bottom aligned box.
        this.baseline_offset_from_top_ =
          max_bottom_aligned_height.SUB(baseline_offset_from_bottom);
      }
      if (max_top_aligned_height.GT(this.height_)) {
        // Increase the line box height below the baseline to make the largest
        // top-aligned child box fit.
        this.height_ = max_top_aligned_height;
        baseline_offset_from_bottom = this.height_.SUB(this.baseline_offset_from_top_);
      }
    }
  }
  UpdateChildBoxTopPositions() {
    let top_offset = new LayoutUnit(this.top_);
    if (this.position_children_relative_to_baseline_) {
      // For InlineContainerBoxes, the children have to be aligned to the baseline
      // so that the vertical positioning can be consistent with the box position
      // with line-height and different font sizes.
      top_offset.SUB_ASSIGN(this.baseline_offset_from_top_);
    }
    // During this loop, the vertical positions of the child boxes are
    // established.
    for (let child_box of this.child_boxes_) {

      // The child box top position depends on the vertical-align property.
      //   https://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align
      let vertical_align =
        child_box.computed_style()!.vertical_align;
      let child_top = new LayoutUnit();
      if (vertical_align == KeywordValue.GetMiddle()) {
        // Align the vertical midpoint of the box with the baseline of the parent
        //  box plus half the x-height (height of the 'x' glyph) of the parent.
        child_top = this.baseline_offset_from_top_.SUB(this.GetHeightAboveMiddleAlignmentPoint(child_box));
      } else if (vertical_align == KeywordValue.GetTop()) {
        // Align the top of the aligned subtree with the top of the line box.
        // Nothing to do child_top is already zero
      } else if (vertical_align == KeywordValue.GetBottom()) {
        // Align the bottom of the aligned subtree with the bottom of the line
        // box.
        child_top = this.height_.SUB(child_box.GetInlineLevelBoxHeight());
      } else if (vertical_align == KeywordValue.GetBaseline()) {
        // Align the baseline of the box with the baseline of the parent box.
        child_top = this.baseline_offset_from_top_.SUB(child_box.GetBaselineOffsetFromTopMarginEdge())
        ;
      } else {
        NOTREACHED('Unsupported vertical_align property value');
      }
      child_box.set_top(top_offset.ADD(child_top).ADD(child_box.GetInlineLevelTopMargin()));
    }
  }
  MaybePlaceEllipsis() {
    // Check to see if an ellipsis should be placed, which only occurs when the
    // ellipsis has a positive width and the content has overflowed the line.
    if (this.ellipsis_width_.LE(new LayoutUnit()) ||
      this.shrink_to_fit_width_.LE(this.layout_params_.containing_block_size.width())) {
      return;
    }

    // Determine the preferred start edge offset for the ellipsis, which is the
    // offset at which the ellipsis begins clipping content on the line.
    // - If the ellipsis fully fits on the line, then the preferred end edge for
    //   the ellipsis is the line's end edge. Therefore the preferred ellipsis
    //   start edge is simply the end edge offset by the ellipsis's width.
    // - However, if there is insufficient space for the ellipsis to fully fit on
    //   the line, then the ellipsis should overflow the line's end edge, rather
    //   than its start edge. As a result, the preferred ellipsis start edge
    //   offset is simply the line's start edge.
    // https://www.w3.org/TR/css3-ui/#propdef-text-overflow
    let preferred_start_edge_offset = new LayoutUnit();
    if (this.ellipsis_width_.LE(this.layout_params_.containing_block_size.width())) {
      preferred_start_edge_offset =
        this.base_direction_ == BaseDirection.kRightToLeftBaseDirection
          ? this.ellipsis_width_
          : this.layout_params_.containing_block_size.width().SUB(this.ellipsis_width_);
    } else {
      preferred_start_edge_offset =
        this.base_direction_ == BaseDirection.kRightToLeftBaseDirection
          ? this.layout_params_.containing_block_size.width()
          : new LayoutUnit();
    }

    // Whether or not a character or atomic inline-level element has been
    // encountered within the boxes already checked on the line. The ellipsis
    // cannot be placed at an offset that precedes the first character or atomic
    // inline-level element on a line.
    // https://www.w3.org/TR/css3-ui/#propdef-text-overflow
    let is_placement_requirement_met = false;

    // The start edge offset at which the ellipsis was eventually placed. This
    // will be set by TryPlaceEllipsisOrProcessPlacedEllipsis() within one of the
    // child boxes.
    // NOTE: While this is guaranteed to be set later, initializing it here keeps
    // compilers from complaining about it being an uninitialized variable below.
    let placed_start_edge_offset = new LayoutUnit();

    // Walk each box within the line in base direction order attempting to place
    // the ellipsis and update the box's ellipsis state. Even after the ellipsis
    // is placed, subsequent boxes must still be processed, as their state may
    // change as a result of having an ellipsis preceding them on the line.
    if (this.base_direction_ == BaseDirection.kRightToLeftBaseDirection) {
      for (let i = this.child_boxes_.length - 1; i > -1; i--) {
        let child_box = this.child_boxes_[i];
        let {
          is_placement_requirement_met: is_placement_requirement_met_result,
          is_placed: is_placed_result,
          placed_offset: placed_offset_result
        } = child_box.TryPlaceEllipsisOrProcessPlacedEllipsis(
          this.base_direction_,
          preferred_start_edge_offset,
          is_placement_requirement_met,
          this.is_ellipsis_placed_,
          placed_start_edge_offset);
        is_placement_requirement_met = is_placement_requirement_met_result;
        this.is_ellipsis_placed_ = is_placed_result;
        placed_start_edge_offset = placed_offset_result;
      }
    } else {
      for (let child_box of this.child_boxes_) {
        let {
          is_placed: is_placed_result,
          is_placement_requirement_met: is_placement_requirement_met_result,
          placed_offset: placed_offset_result
        } =
          child_box.TryPlaceEllipsisOrProcessPlacedEllipsis(
            this.base_direction_, preferred_start_edge_offset,
            is_placement_requirement_met, this.is_ellipsis_placed_,
            placed_start_edge_offset);
        is_placement_requirement_met = is_placement_requirement_met_result;
        this.is_ellipsis_placed_ = is_placed_result;
        placed_start_edge_offset = placed_offset_result;
      }
    }

    // Set |placed_ellipsis_offset_|. This is the offset at which an ellipsis will
    // be rendered and represents the left edge of the placed ellipsis.
    // In the case where the line's base direction is right-to-left and the start
    // edge is the right edge of the ellipsis, the width of the ellipsis must be
    // subtracted to produce the left edge of the ellipsis.
    this.placed_ellipsis_offset_ = this.base_direction_ == BaseDirection.kRightToLeftBaseDirection
      ? placed_start_edge_offset.SUB(this.ellipsis_width_)
      : placed_start_edge_offset;
  }

  GetHeightAboveMiddleAlignmentPoint(child_box: Box): LayoutUnit {
    return (child_box.GetInlineLevelBoxHeight().ADD(new LayoutUnit(this.font_metrics_.x_height()))).DIV(2);
  }
  ComputeHorizontalAlignment(): HorizontalAlignment {
    // When the total width of the inline-level boxes on a line is less than
    // the width of the line box containing them, their horizontal distribution
    // within the line box is determined by the "text-align" property.
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting.
    // text-align is vaguely specified by
    // https://www.w3.org/TR/css-text-3/#text-align.

    let horizontal_alignment: HorizontalAlignment;
    if (this.layout_params_.containing_block_size.width().LT(this.shrink_to_fit_width_)) {
      // If the content has overflowed the line, then do not base horizontal
      // alignment on the value of text-align. Instead, simply rely upon the base
      // direction of the line, so that inline-level content begins at the
      // starting edge of the line.
      horizontal_alignment = this.base_direction_ == BaseDirection.kRightToLeftBaseDirection
        ? HorizontalAlignment.kRightHorizontalAlignment
        : HorizontalAlignment.kLeftHorizontalAlignment;
    } else if (this.text_align_ == KeywordValue.GetStart()) {
      // If the value of text-align is start, then inline-level content is aligned
      // to the start edge of the line box.
      horizontal_alignment = this.base_direction_ == BaseDirection.kRightToLeftBaseDirection
        ? HorizontalAlignment.kRightHorizontalAlignment
        : HorizontalAlignment.kLeftHorizontalAlignment;
    } else if (this.text_align_ == KeywordValue.GetEnd()) {
      // If the value of text-align is end, then inline-level content is aligned
      // to the end edge of the line box.
      horizontal_alignment = this.base_direction_ == BaseDirection.kRightToLeftBaseDirection
        ? HorizontalAlignment.kLeftHorizontalAlignment
        : HorizontalAlignment.kRightHorizontalAlignment;
    } else if (this.text_align_ == KeywordValue.GetLeft()) {
      // If the value of text-align is left, then inline-level content is aligned
      // to the left line edge.
      horizontal_alignment = HorizontalAlignment.kLeftHorizontalAlignment;
    } else if (this.text_align_ == KeywordValue.GetRight()) {
      // If the value of text-align is right, then inline-level content is aligned
      // to the right line edge.
      horizontal_alignment = HorizontalAlignment.kRightHorizontalAlignment;
    } else if (this.text_align_ == KeywordValue.GetCenter()) {
      // If the value of text-align is center, then inline-content is centered
      // within the line box.
      horizontal_alignment = HorizontalAlignment.kCenterHorizontalAlignment;
    } else {
      NOTREACHED('Unknown value of "text-align".');
      horizontal_alignment = HorizontalAlignment.kLeftHorizontalAlignment;
    }
    return horizontal_alignment;
  }
};

