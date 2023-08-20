// The CSS 2.1 specification defines an inline box as an inline-level box whose
// contents participate in its containing inline formatting context. In fact,
// this definition matches two different types of boxes:
//   - a text box;
//   - an inline-level container box that contains other inline-level boxes
//     (including text boxes).
// This class implements the latter.
//
// Note that "inline box" and "inline-level box" are two different concepts.
// Inline-level boxes that are not inline boxes (such as inline-block elements)
// are called atomic inline-level boxes because they participate in their inline
// formatting context as a single opaque box.
//   https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
import { ContainerBox } from './container_box';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { GetUsedBorderBottom, GetUsedBorderLeft, GetUsedBorderRight, GetUsedBorderTop, GetUsedHeightIfNotAuto, GetUsedMarginLeftIfNotAuto, GetUsedMarginRightIfNotAuto, GetUsedPaddingBottom, GetUsedPaddingLeft, GetUsedPaddingRight, GetUsedPaddingTop, UsedStyleProvider } from './used_style';
import { BaseDirection } from './base_direction';
import { LayoutUnit } from './layout_unit';
import { FontList } from '../dom/font_list';
import { Box, LayoutParams, Level } from './box';
import { NOTIMPLEMENTED, NOTREACHED } from '../../base/common/notreached';
import { LineBox } from './line_box';
import { KeywordValue } from '../cssom/keyword_value';
import { WrapAtPolicy, WrapOpportunityPolicy, WrapResult } from './line_wrapping';
import { DCHECK } from '../../base/check';
import { Ptr } from '../../base/common/typescript';
import { DCHECK_EQ } from '../../base/check_op';
import { QuadF } from '../math/quad_f';
import { MapCoordinatesFlags } from './map_coordinates_flags';

export class InlineContainerBox extends ContainerBox {
  should_collapse_leading_white_space_: boolean;
  should_collapse_trailing_white_space_: boolean;
  has_leading_white_space_: boolean;
  has_trailing_white_space_: boolean;
  is_collapsed_: boolean;

  justifies_line_existence_: boolean;
  first_box_justifying_line_existence_index_: number;
  baseline_offset_from_margin_box_top_ = new LayoutUnit;
  line_height_ = new LayoutUnit;
  inline_top_margin_ = new LayoutUnit;

  // A font used for text width and line height calculations.
  used_font_: FontList;

  is_split_on_left_: boolean;
  is_split_on_right_: boolean;

  base_direction_: BaseDirection;
  //
  // // A reference to the next inline container box in a linked list of inline
  // // container boxes produced from splits of the initial text box. This enables
  // // HTMLElement to retain access to all of its layout boxes after they are
  // // split.
  split_sibling_: Ptr<InlineContainerBox>;
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    used_style_provider: UsedStyleProvider,
    // LayoutStatTracker* layout_stat_tracker,
    base_direction: BaseDirection
  ) {
    super(css_computed_style_declaration, used_style_provider);

    this.should_collapse_leading_white_space_ = false;
    this.should_collapse_trailing_white_space_ = false;
    this.has_leading_white_space_ = false;
    this.has_trailing_white_space_ = false;
    this.is_collapsed_ = false;
    this.justifies_line_existence_ = false;
    this.first_box_justifying_line_existence_index_ = 0;
    this.used_font_ = used_style_provider.GetUsedFontList(
      css_computed_style_declaration.data().font_family,
      css_computed_style_declaration.data().font_size,
      css_computed_style_declaration.data().font_style,
      css_computed_style_declaration.data().font_weight);
    this.is_split_on_left_ = false;
    this.is_split_on_right_ = false;
    this.base_direction_ = base_direction;
  }
  AsInlineContainerBox() {
    return this;
  }

  GetLevel() { return Level.kInlineLevel; }
  TryAddChild(child_box: Box): boolean {
    switch (child_box.GetLevel()) {
      case Level.kBlockLevel:
        if (!child_box.IsAbsolutelyPositioned()) {
          // Only inline-level boxes are allowed as in-flow children of an inline
          // container box.
          return false;
        }
      // Fall through if out-of-flow.

      case Level.kInlineLevel:
        // If the inline container box already contains a line break, then no
        // additional children can be added to it.
        if (this.HasTrailingLineBreak()) {
          return false;
        }

        this.PushBackDirectChild(child_box);
        return true;

      default:
        NOTREACHED();
        return false;
    }
  }

  TrySplitAtEnd() {
    let box_after_split = new InlineContainerBox(
      this.css_computed_style_declaration(),
      this.used_style_provider(),
      // this. layout_stat_tracker(),
      this.base_direction_);
    // Set the state of where the sibling boxes are split using
    // base_direction_ to determine the correct way to split the boxes for
    // dir : rtl or ltr.
    if (this.base_direction_ == BaseDirection.kLeftToRightBaseDirection) {
      this.is_split_on_right_ = true;
      box_after_split.SetIsSplitOnLeft(true);
    } else {
      this.is_split_on_left_ = true;
      box_after_split.SetIsSplitOnRight(true);
    }

    return box_after_split;
  }
  GetInlineLevelBoxHeight() {
    return this.line_height_;
  }
  GetInlineLevelTopMargin() {
    return this.inline_top_margin_;
  }
  SetIsSplitOnLeft(is_split_on_left: boolean) {
    this.is_split_on_left_ = is_split_on_left;
  }
  SetIsSplitOnRight(is_split_on_right: boolean) {
    this.is_split_on_right_ = is_split_on_right;
  }

  UpdateContentSizeAndMargins(
    layout_params: LayoutParams) {
    // Lay out child boxes as one line without width constraints and white space
    // trimming.
    let font_metrics = this.used_font_.GetFontMetrics();
    let box_top_height = new LayoutUnit(font_metrics.ascent());
    let line_box = new LineBox(
      box_top_height,
      true,
      this.computed_style().line_height,
      font_metrics,
      this.should_collapse_leading_white_space_,
      this.should_collapse_trailing_white_space_,
      layout_params,
      BaseDirection.kLeftToRightBaseDirection,
      KeywordValue.GetLeft(),
      this.computed_style().font_size, new LayoutUnit(), new LayoutUnit());

    for (let box of this.child_boxes()) {
      line_box.BeginAddChildAndMaybeOverflow(box);
    }

    line_box.EndUpdates();

    if (!layout_params.freeze_width) {
      // Although the spec says:
      //
      // The "width" property does not apply.
      //   https://www.w3.org/TR/CSS21/visudet.html#inline-width
      //
      // ...it is not the entire truth. It merely means that we have to ignore
      // the computed value of "width". Instead we use the shrink-to-fit width of
      // a hypothetical line box that contains all children. Later on this allow
      // to apply the following rule:
      //
      // When an inline box exceeds the width of a line box, it is split into
      // several boxes.
      //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
      this.set_width(line_box.shrink_to_fit_width());

      if (this.is_split_on_left_) {
        // When an inline box is split, margins, borders, and padding
        // have no visual effect where the split occurs. (or at any split, when
        // there are several).
        //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
        this.set_margin_left(new LayoutUnit());
      } else {
        // A computed value of "auto" for "margin-left" or "margin-right" becomes
        // a used value of "0".
        //   https://www.w3.org/TR/CSS21/visudet.html#inline-width
        let maybe_margin_left = GetUsedMarginLeftIfNotAuto(
          this.computed_style(), layout_params.containing_block_size);
        this.set_margin_left(maybe_margin_left || new LayoutUnit());
      }

      if (this.is_split_on_right_) {
        // When an inline box is split, margins, borders, and padding
        // have no visual effect where the split occurs. (or at any split, when
        // there are several).
        //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
        this.set_margin_right(new LayoutUnit());
      } else {
        // A computed value of "auto" for "margin-left" or "margin-right" becomes
        // a used value of "0".
        //   https://www.w3.org/TR/CSS21/visudet.html#inline-width
        let maybe_margin_right =
          GetUsedMarginRightIfNotAuto(this.computed_style(),
            layout_params.containing_block_size);
        this.set_margin_right(maybe_margin_right || new LayoutUnit());
      }
    }

// The "height" property does not apply. The height of the content area should
// be based on the font, but this specification does not specify how. [...]
// However, we suggest that the height is chosen such that the content area
// is just high enough for [...] the maximum ascenders and descenders, of all
// the fonts in the element.
//   https://www.w3.org/TR/CSS21/visudet.html#inline-non-replaced
//
// Above definition of used height matches the height of hypothetical line box
// that contains all children.
    this.set_height(new LayoutUnit(font_metrics.em_box_height()));

// On a non-replaced inline element, 'line-height' specifies the height that
// is used in the calculation of the line box height.
//   https://www.w3.org/TR/CSS21/visudet.html#propdef-line-height
    this.line_height_ = line_box.height();

// Vertical margins will not have any effect on non-replaced inline elements.
//   https://www.w3.org/TR/CSS21/box.html#margin-properties
    this.set_margin_top(new LayoutUnit());
    this.set_margin_bottom(new LayoutUnit());
    this.inline_top_margin_ = line_box.baseline_offset_from_top()
      .SUB(line_box.top())
      .SUB(this.border_top_width())
      .SUB(this.padding_top());

    this.has_leading_white_space_ = line_box.HasLeadingWhiteSpace();
    this.has_trailing_white_space_ = line_box.HasTrailingWhiteSpace();
    this.is_collapsed_ = line_box.IsCollapsed();
    this.justifies_line_existence_ =
      line_box.LineExists() || this.HasNonZeroMarginOrBorderOrPadding();
    this.first_box_justifying_line_existence_index_ =
      line_box.GetFirstBoxJustifyingLineExistenceIndex();
    this.baseline_offset_from_margin_box_top_ = line_box.baseline_offset_from_top();

    let maybe_height = GetUsedHeightIfNotAuto(
      this.computed_style(), layout_params.containing_block_size, undefined);
    let child_layout_params = new LayoutParams;
    let absolute_child_layout_params = new LayoutParams;
    child_layout_params.containing_block_direction = this.base_direction_;
    absolute_child_layout_params.containing_block_direction = this.base_direction_;
// If the element's position is "relative" or "static", the containing block
// is formed by the content edge of the nearest block container ancestor
// box.
//   https://www.w3.org/TR/CSS21/visudet.html#containing-block-details
    child_layout_params.containing_block_size.set_width(this.width());
// If the element has 'position: absolute', ...
// the containing block is formed by the padding edge of the ancestor.
//   http://www.w3.org/TR/CSS21/visudet.html#containing-block-details
    absolute_child_layout_params.containing_block_size.set_width(
      this.GetPaddingBoxWidth());
    child_layout_params.maybe_margin_top = new LayoutUnit();
    child_layout_params.maybe_margin_bottom = new LayoutUnit();
    child_layout_params.maybe_height = maybe_height;

// Positioned children are laid out at the end as their position and size
// depends on the size of the containing block as well as possibly their
// previously calculated in-flow position.
    child_layout_params.containing_block_size.set_height(this.height());
    absolute_child_layout_params.containing_block_size.set_height(
      this.GetPaddingBoxHeight());
    this.UpdateRectOfPositionedChildBoxes(child_layout_params,
      absolute_child_layout_params);
  }

  UpdateBorders() {
    if (this.IsBorderStyleNoneOrHidden(this.computed_style().border_left_style) &&
      this.IsBorderStyleNoneOrHidden(this.computed_style().border_top_style) &&
      this.IsBorderStyleNoneOrHidden(this.computed_style().border_right_style) &&
      this.IsBorderStyleNoneOrHidden(this.computed_style().border_bottom_style)) {
      this.ResetBorderInsets();
      return;
    }
    // When an inline box is split, margins, borders, and padding
    // have no visual effect where the split occurs. (or at any split, when there
    // are several).
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
    this.SetBorderInsets(
      this.is_split_on_left_ ? new LayoutUnit() : GetUsedBorderLeft(this.computed_style()),
      GetUsedBorderTop(this.computed_style()),
      this.is_split_on_right_ ? new LayoutUnit() : GetUsedBorderRight(this.computed_style()),
      GetUsedBorderBottom(this.computed_style()));
  }

  UpdatePaddings(layout_params: LayoutParams) {
    // When an inline box is split, margins, borders, and padding
    // have no visual effect where the split occurs. (or at any split, when there
    // are several).
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
    this.SetPaddingInsets(
      this.is_split_on_left_
        ? new LayoutUnit()
        : GetUsedPaddingLeft(this.computed_style(),
          layout_params.containing_block_size),
      GetUsedPaddingTop(this.computed_style(), layout_params.containing_block_size),
      this.is_split_on_right_
        ? new LayoutUnit()
        : GetUsedPaddingRight(this.computed_style(),
          layout_params.containing_block_size),
      GetUsedPaddingBottom(this.computed_style(),
        layout_params.containing_block_size));
  }

  TryWrapAt(
    wrap_at_policy: WrapAtPolicy,
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean) {
    DCHECK(!this.IsAbsolutelyPositioned());
    DCHECK(is_line_existence_justified || this.justifies_line_existence_);

    switch (wrap_at_policy) {
      case  WrapAtPolicy.kWrapAtPolicyBefore:
        return this.TryWrapAtBefore(wrap_opportunity_policy,
          is_line_existence_justified, available_width,
          should_collapse_trailing_white_space);
      case  WrapAtPolicy.kWrapAtPolicyLastOpportunityWithinWidth:
        return this.TryWrapAtLastOpportunityWithinWidth(
          wrap_opportunity_policy, is_line_existence_justified, available_width,
          should_collapse_trailing_white_space);
      case  WrapAtPolicy.kWrapAtPolicyLastOpportunity:
        return this.TryWrapAtLastOpportunityBeforeIndex(
          this.child_boxes().length, wrap_opportunity_policy,
          is_line_existence_justified, available_width,
          should_collapse_trailing_white_space);
      case  WrapAtPolicy.kWrapAtPolicyFirstOpportunity:
        return this.TryWrapAtFirstOpportunity(
          wrap_opportunity_policy, is_line_existence_justified, available_width,
          should_collapse_trailing_white_space);
      default:
        NOTREACHED();
        return WrapResult.kWrapResultNoWrap;
    }
  }

  GetSplitSibling() {
    return this.split_sibling_;
  }

  DoesFulfillEllipsisPlacementRequirement() {
    for (let child_box of this.child_boxes()) {
      if (child_box.DoesFulfillEllipsisPlacementRequirement()) {
        return true;
      }
    }
    return false;
  }

  DoPreEllipsisPlacementProcessing() {
    for (let child_box of this.child_boxes()) {
      child_box.DoPreEllipsisPlacementProcessing();
    }
  }

  DoPostEllipsisPlacementProcessing() {
    for (let child_box of this.child_boxes()) {
      child_box.DoPostEllipsisPlacementProcessing();
    }
  }

  TrySplitAtSecondBidiLevelRun() {
    // 暂时不支持 rtl ltr 混合
    return false;
    // let kInvalidLevel = -1;
    // let last_level = kInvalidLevel;
    //
    // let child_box_iterator = 0;
    // const last = this.child_boxes().length - 1;
    // while (child_box_iterator < last) {
    //   const child_box = this.child_boxes()[child_box_iterator];
    //   let current_level = child_box.GetBidiLevel() || last_level;
    //
    //   // If the last level isn't equal to the current level, then check on whether
    //   // or not the last level is kInvalidLevel. If it is, then no initial value
    //   // has been set yet. Otherwise, the intersection of two bidi levels has been
    //   // found where a split should occur.
    //   if (last_level != current_level) {
    //     if (last_level == kInvalidLevel) {
    //       last_level = current_level;
    //     } else {
    //       break;
    //     }
    //   }
    //
    //   // Try to split the child box's internals.
    //   if (child_box.TrySplitAtSecondBidiLevelRun()) {
    //     child_box_iterator = this.InsertSplitSiblingOfDirectChild(child_box_iterator);
    //     break;
    //   }
    //
    //   ++child_box_iterator;
    // }
    //
    // // If the iterator reached the end, then no split was found.
    // if (child_box_iterator == last) {
    //   return false;
    // }
    //
    // this.SplitAtIterator(child_box_iterator);
    // return true;
  }

  GetBidiLevel() {
    if (this.child_boxes().length) {
      return this.child_boxes()[0].GetBidiLevel();
    }

    return undefined;
  }

  SetShouldCollapseLeadingWhiteSpace(
    should_collapse_leading_white_space: boolean) {
    if (this.should_collapse_leading_white_space_ !=
      should_collapse_leading_white_space) {
      this.should_collapse_leading_white_space_ = should_collapse_leading_white_space;
      this.InvalidateUpdateSizeInputs();
    }
  }

  SetShouldCollapseTrailingWhiteSpace(
    should_collapse_trailing_white_space: boolean) {
    if (this.should_collapse_trailing_white_space_ !=
      should_collapse_trailing_white_space) {
      this.should_collapse_trailing_white_space_ =
        should_collapse_trailing_white_space;
      this.InvalidateUpdateSizeInputs();
    }
  }

  HasLeadingWhiteSpace() {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    DCHECK_EQ(this.width(), this.width());  // Width should not be NaN.

    return this.has_leading_white_space_;
  }

  HasTrailingWhiteSpace() {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    DCHECK_EQ(this.width(), this.width());  // Width should not be NaN.

    return this.has_trailing_white_space_;
  }

  IsCollapsed() {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    DCHECK_EQ(this.width(), this.width());  // Width should not be NaN.

    return this.is_collapsed_;
  }

  JustifiesLineExistence() {
    return this.justifies_line_existence_;
  }

  HasTrailingLineBreak() {
    if (this.child_boxes().length) {
      return this.child_boxes()[this.child_boxes().length - 1].HasTrailingLineBreak();
    }
    return false;
  }

  AffectsBaselineInBlockFormattingContext() {
    //  "Should only be called in a block formatting context.";
    return NOTREACHED();
  }

  GetBaselineOffsetFromTopMarginEdge() {
    return this.baseline_offset_from_margin_box_top_;
  }

  IsTransformable() { return false; }

  DumpClassName(stream: string): string {
    stream += 'InlineContainerBox ';
    return stream;
  }

  DumpProperties(stream: string): string {
    stream = super.DumpProperties(stream);
    stream += 'line_height=';
    stream += this.line_height_.toFloat();
    stream += ' ';
    stream += 'inline_top_margin=';
    stream += this.inline_top_margin_.toFloat();
    stream += ' ';
    stream += 'has_leading_white_space=';
    stream += this.has_leading_white_space_;
    stream += ' ';
    stream += 'has_trailing_white_space=';
    stream += this.has_trailing_white_space_;
    stream += ' ';
    stream += 'is_collapsed=';
    stream += this.is_collapsed_;
    stream += ' ';
    stream += 'justifies_line_existence=';
    stream += this.justifies_line_existence_;
    stream += ' ';
    return stream;
  }

  DoPlaceEllipsisOrProcessPlacedEllipsis(
    base_direction: BaseDirection,
    desired_offset: LayoutUnit,
    is_placement_requirement_met: boolean, is_placed: boolean, placed_offset: LayoutUnit
  ): { is_placement_requirement_met: boolean, is_placed: boolean, placed_offset: LayoutUnit } {
    placed_offset = placed_offset.CLONE();
    // If the ellipsis hasn't been previously placed, but the placement
    // requirement is met and its desired offset comes before the content box's
    // start edge, then place the ellipsis at its desired position. This can occur
    // when the desired position falls between the start edge of the margin box
    // and the start edge of its content box.
    if (!is_placed && is_placement_requirement_met) {
      let content_box_start_edge_offset =
        this.GetContentBoxStartEdgeOffsetFromContainingBlock(base_direction);
      if ((base_direction == BaseDirection.kRightToLeftBaseDirection &&
          desired_offset >= content_box_start_edge_offset) ||
        (base_direction != BaseDirection.kRightToLeftBaseDirection &&
          desired_offset <= content_box_start_edge_offset)) {
        is_placed = true;
        placed_offset = desired_offset;
      }
    }

    let was_placed_before_children = is_placed;

// Subtract the content box offset from the desired offset. This box's
// children will treat its content box left edge as the base ellipsis offset
// position, and the content box offset will be re-added after the ellipsis
// is placed. This allows its children to only focus on their offset from
// their containing block, and not worry about nested containing blocks.
    let content_box_offset =
      this.GetContentBoxLeftEdgeOffsetFromContainingBlock();
    desired_offset.SUB_ASSIGN(content_box_offset);

// Walk each child box in base direction order attempting to place the
// ellipsis and update the box's ellipsis state. Even after the ellipsis is
// placed, subsequent boxes must still be processed, as their state my change
// as a result of having an ellipsis preceding them on the line.
    if (base_direction == BaseDirection.kRightToLeftBaseDirection) {
      for (let child_box of this.child_boxes()) {
        // Out-of-flow boxes are not impacted by ellipses.
        if (child_box.IsAbsolutelyPositioned()) {
          continue;
        }
        child_box.TryPlaceEllipsisOrProcessPlacedEllipsis(
          base_direction, desired_offset, is_placement_requirement_met,
          is_placed, placed_offset);
      }
    } else {
      for (let child_box of this.child_boxes()) {
        // Out-of-flow boxes are not impacted by ellipses.
        if (child_box.IsAbsolutelyPositioned()) {
          continue;
        }
        child_box.TryPlaceEllipsisOrProcessPlacedEllipsis(
          base_direction, desired_offset, is_placement_requirement_met,
          is_placed, placed_offset);
      }
    }

// If the ellipsis was not placed prior to processing the child boxes, then it
// is guaranteed that the placement location comes after the start edge of the
// content box. The content box's offset needs to be added back to the placed
// offset, so that the offset again references this box's containing block.
// Additionally, in the event that the ellipsis was not placed within a child
// box, it will now be placed.
    if (!was_placed_before_children) {
      // If the ellipsis hasn't been placed yet, then place the ellipsis at its
      // desired position. This case can occur when the desired position falls
      // between the end edge of the box's content and the end edge of the box's
      // margin. In this case, |is_placement_requirement_met| does not need to be
      // checked, as it is guaranteed that one of the child boxes met the
      // requirement.
      if (!(is_placed)) {
        is_placed = true;
        placed_offset = desired_offset;
      }

      placed_offset.ADD_ASSIGN(content_box_offset);
    }

    return {
      is_placed,
      is_placement_requirement_met,
      placed_offset,
    };
  }

  private TryWrapAtBefore(
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_requirement_met: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean) {
    // If there are no boxes within the inline container box, then there is no
    // first box to try to wrap before. This box does not provide a wrappable
    // point on its own. Additionally, if the line requirement has not been met
    // before this box, then no wrap is available.
    if (this.child_boxes().length == 0 || !is_line_requirement_met) {
      return WrapResult.kWrapResultNoWrap;
    } else {
      // Otherwise, attempt to wrap before the first child box.
      return this.TryWrapAtIndex(0, WrapAtPolicy.kWrapAtPolicyBefore, wrap_opportunity_policy,
        is_line_requirement_met, available_width,
        should_collapse_trailing_white_space);
    }
  }

  private TryWrapAtLastOpportunityWithinWidth(
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean) {
    DCHECK(this.GetMarginBoxWidth().GT(available_width));

    // Calculate the available width where the content begins. If the content
    // does not begin within the available width, then the wrap can only occur
    // before the inline container box.
    available_width.SUB_ASSIGN(this.GetContentBoxLeftEdgeOffsetFromMarginBox());
    if (available_width.LT(new LayoutUnit(0))) {
      return this.TryWrapAtBefore(wrap_opportunity_policy, is_line_existence_justified,
        available_width,
        should_collapse_trailing_white_space);
    }

    // Determine the child box where the overflow occurs. If the overflow does not
    // occur until after the end of the content, then the overflow index will be
    // set to the number of child boxes.
    let overflow_index = 0;
    while (overflow_index < this.child_boxes().length) {
      let child_box = this.child_boxes()[overflow_index];
      // Absolutely positioned boxes are not included in width calculations.
      if (child_box.IsAbsolutelyPositioned()) {
        continue;
      }

      let child_width = child_box.GetMarginBoxWidth();
      if (child_width.GT(available_width)) {
        break;
      }
      available_width.SUB_ASSIGN(child_width);
      ++overflow_index;
    }

    // If the overflow occurs before the line is justified, then no wrap is
    // available.
    if (!is_line_existence_justified &&
      overflow_index < this.first_box_justifying_line_existence_index_) {
      return WrapResult.kWrapResultNoWrap;
    }

    // If the overflow occurred within the content and not after, then attempt to
    // wrap within the box that overflowed and return the result if the wrap is
    // successful.
    if (overflow_index < this.child_boxes().length) {
      let wrap_result =
        this.TryWrapAtIndex(overflow_index, WrapAtPolicy.kWrapAtPolicyLastOpportunityWithinWidth,
          wrap_opportunity_policy, is_line_existence_justified,
          available_width, should_collapse_trailing_white_space);
      if (wrap_result != WrapResult.kWrapResultNoWrap) {
        return wrap_result;
      }
    }

    // If no wrap was found within the box that overflowed, then attempt to wrap
    // within an earlier child box.
    return this.TryWrapAtLastOpportunityBeforeIndex(
      overflow_index, wrap_opportunity_policy, is_line_existence_justified,
      available_width, should_collapse_trailing_white_space);
  }

  private TryWrapAtLastOpportunityBeforeIndex(
    index: number,
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean) {
    let wrap_result = WrapResult.kWrapResultNoWrap;

    // If the line is already justified, then any child before the index is
    // potentially wrappable. Otherwise, children preceding the first box that
    // justifies the line's existence do not need to be checked, as they can
    // never be wrappable.
    let first_wrappable_index =
      is_line_existence_justified ? 0
        : this.first_box_justifying_line_existence_index_;

    // Iterate backwards through the children attempting to wrap until a wrap is
    // successful or the first wrappable index is reached.
    while (wrap_result == WrapResult.kWrapResultNoWrap && index > first_wrappable_index) {
      --index;
      wrap_result =
        this.TryWrapAtIndex(index, WrapAtPolicy.kWrapAtPolicyLastOpportunity,
          wrap_opportunity_policy, is_line_existence_justified,
          available_width, should_collapse_trailing_white_space);
    }

    return wrap_result;
  }

  private TryWrapAtFirstOpportunity(
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean) {
    let wrap_result = WrapResult.kWrapResultNoWrap;

    // If the line is already justified, then any child is potentially wrappable.
    // Otherwise, children preceding the first box that justifies the line's
    // existence do not need to be checked, as they can never be wrappable.
    let check_index = is_line_existence_justified
      ? 0
      : this.first_box_justifying_line_existence_index_;

    // Iterate forward through the children attempting to wrap until a wrap is
    // successful or all of the children have been attempted.
    for (; wrap_result == WrapResult.kWrapResultNoWrap && check_index < this.child_boxes().length;
           ++check_index) {
      wrap_result =
        this.TryWrapAtIndex(check_index, WrapAtPolicy.kWrapAtPolicyFirstOpportunity,
          wrap_opportunity_policy, is_line_existence_justified,
          available_width, should_collapse_trailing_white_space);
    }

    return wrap_result;
  }

  private TryWrapAtIndex(
    wrap_index: number,
    wrap_at_policy: WrapAtPolicy,
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean) {
    let child_box = this.child_boxes()[wrap_index];
    if (child_box.IsAbsolutelyPositioned()) {
      this.SplitAtIterator(wrap_index);
      return WrapResult.kWrapResultSplitWrap;
    }

    // Check for whether the line is justified before this child. If it is not,
    // then verify that the line is justified within this child. This function
    // should not be called for unjustified indices.
    let is_line_existence_justified_before_index =
      is_line_existence_justified ||
      wrap_index > this.first_box_justifying_line_existence_index_;
    DCHECK(is_line_existence_justified_before_index ||
      wrap_index == this.first_box_justifying_line_existence_index_);

    let wrap_result = child_box.TryWrapAt(
      wrap_at_policy, wrap_opportunity_policy,
      is_line_existence_justified_before_index, available_width,
      should_collapse_trailing_white_space);
    // If the no wrap was found, then simply return out. There's nothing to do.
    if (wrap_result == WrapResult.kWrapResultNoWrap) {
      return WrapResult.kWrapResultNoWrap;
      // Otherwise, if the wrap is before the first child, then the wrap is
      // happening before the full inline container box and no split is
      // occurring.
      // When breaks happen before the first or the last character of a box,
      // the break occurs immediately before/after the box (at its margin edge)
      // rather than breaking the box between its content edge and the content.
      //   https://www.w3.org/TR/css-text-3/#line-breaking
    } else if (wrap_result == WrapResult.kWrapResultWrapBefore && wrap_index == 0) {
      return WrapResult.kWrapResultWrapBefore;
      // In all other cases, the inline container box is being split as a result
      // of the wrap.
    } else {
      let wrap_iterator = wrap_index;
      // If the child was split during its wrap, then the split sibling that was
      // produced by the split needs to be added to the container's children.
      if (wrap_result == WrapResult.kWrapResultSplitWrap) {
        wrap_iterator = this.InsertSplitSiblingOfDirectChild(wrap_iterator);
      }

      this.SplitAtIterator(wrap_iterator);
      return WrapResult.kWrapResultSplitWrap;
    }
  }

  SplitAtIterator(
    child_split_iterator: number) {
    // Move the children after the split into a new box.
    let box_after_split = new InlineContainerBox(
      this.css_computed_style_declaration(),
      this.used_style_provider(),
      // layout_stat_tracker(),
      this.base_direction_);

    // Set the state of where the sibling boxes are split using
    // base_direction_ to determine the correct way to split the boxes for
    // dir : rtl or ltr.
    if (this.base_direction_ == BaseDirection.kLeftToRightBaseDirection) {
      this.is_split_on_right_ = true;
      box_after_split.SetIsSplitOnLeft(true);
    } else {
      this.is_split_on_left_ = true;
      box_after_split.SetIsSplitOnRight(true);
    }

    // Update the split sibling links.
    box_after_split.split_sibling_ = this.split_sibling_;
    this.split_sibling_ = box_after_split;

    // Now move the children, starting at the iterator, from this container to the
    // split sibling.
    this.MoveDirectChildrenToSplitSibling(child_split_iterator);

    // #ifdef _DEBUG
    // // Make sure that the |UpdateContentSizeAndMargins| is called afterwards.
    //
    // set_width(LayoutUnit());
    // set_height(LayoutUnit());
    //
    // set_margin_left(LayoutUnit());
    // set_margin_top(LayoutUnit());
    // set_margin_right(LayoutUnit());
    // set_margin_bottom(LayoutUnit());
    // #endif  // _DEBUG
  }
  AbsoluteQuadsForSelf(quads: QuadF[], mode: MapCoordinatesFlags): void {
    NOTIMPLEMENTED();
  }
}
