// A base class for block container boxes which implements most of the
// functionality except establishing a formatting context.
//
// Derived classes establish either:
//   - a block formatting context (and thus contain only block-level boxes);
//   - an inline formatting context (and thus contain only inline-level boxes).
//   https://www.w3.org/TR/CSS21/visuren.html#block-boxes
//
// Note that "block container box" and "block-level box" are different concepts.
// A block container box itself may either be a block-level box or
// an inline-level box.
//   https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
import { ContainerBox } from './container_box';
import {
  GetUsedBottomIfNotAuto,
  GetUsedHeightIfNotAuto,
  GetUsedLeftIfNotAuto,
  GetUsedMarginBottomIfNotAuto,
  GetUsedMarginLeftIfNotAuto,
  GetUsedMarginRightIfNotAuto,
  GetUsedMarginTopIfNotAuto,
  GetUsedMaxHeightIfNotNone,
  GetUsedMaxWidthIfNotNone,
  GetUsedMinHeightIfNotAuto,
  GetUsedMinWidthIfNotAuto,
  GetUsedRightIfNotAuto,
  GetUsedTopIfNotAuto,
  GetUsedWidthIfNotAuto,
  IDependsOnContainingBlockHolder,
  UsedStyleProvider
} from './used_style';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { LayoutParams, Level } from './box';
import { BaseDirection } from './base_direction';
import { Optional } from '@neditor/core/base/common/typescript';
import { LayoutUnit } from './layout_unit';
import { SizeLayoutUnit } from './size_layout_unit';
import { FormattingContext } from './formatting_context';
import { WrapAtPolicy, WrapOpportunityPolicy, WrapResult } from './line_wrapping';
import { DCHECK } from '@neditor/core/base/check';
import { DCHECK_EQ } from '@neditor/core/base/check_op';
import { QuadF } from "../math/quad_f";
import { MapCoordinatesFlags } from "./map_coordinates_flags";
import { NOTIMPLEMENTED } from "@neditor/core/base/common/notreached";
import { RectF } from "../math/rect_f";

export abstract class BlockContainerBox extends ContainerBox {
  // A vertical offset of the baseline of the last child box that has one,
  // relatively to the origin of the block container box. Disengaged, if none
  // of the child boxes have a baseline.
  private maybe_baseline_offset_from_top_margin_edge_: Optional<LayoutUnit>;

  // The primary direction in which inline content is ordered on a line and the
  // sides on which the "start" and "end" of a line are.
  // https://www.w3.org/TR/css-writing-modes-3/#inline-base-direction
  private base_direction_: BaseDirection;

  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    base_direction: BaseDirection,
    used_style_provider: UsedStyleProvider
    // LayoutStatTracker* layout_stat_tracker
  ) {
    super(css_computed_style_declaration, used_style_provider);
    this.base_direction_ = base_direction;
  }

  AsBlockContainerBox() {
    return this;
  }
  // From |Box|.
  UpdateContentSizeAndMargins(layout_params: LayoutParams) {
    let maybe_height = GetUsedHeightIfNotAuto(this.computed_style()!, layout_params.containing_block_size!);
    let widthCtxHolder: IDependsOnContainingBlockHolder = Object.create(null)

    let maybe_top = GetUsedTopIfNotAuto(
      this.computed_style()!, layout_params.containing_block_size!);
    let maybe_bottom = GetUsedBottomIfNotAuto(
      this.computed_style()!, layout_params.containing_block_size!);
    let maybe_margin_top = GetUsedMarginTopIfNotAuto(
      this.computed_style()!, layout_params.containing_block_size!);
    let maybe_margin_bottom = GetUsedMarginBottomIfNotAuto(
      this.computed_style()!, layout_params.containing_block_size!);

    if (layout_params.freeze_height) {
      maybe_height = this.height();
    }

    if (!layout_params.freeze_width) {
      let maybe_width = GetUsedWidthIfNotAuto(this.computed_style()!, layout_params.containing_block_size!, widthCtxHolder);
      let maybe_margin_left = GetUsedMarginLeftIfNotAuto(
        this.computed_style()!, layout_params.containing_block_size!);
      let maybe_margin_right = GetUsedMarginRightIfNotAuto(
        this.computed_style()!, layout_params.containing_block_size!);
      let maybe_left = GetUsedLeftIfNotAuto(
        this.computed_style()!, layout_params.containing_block_size!);
      let maybe_right = GetUsedRightIfNotAuto(
        this.computed_style()!, layout_params.containing_block_size!);

      this.UpdateContentWidthAndMargins(layout_params.containing_block_direction,
        layout_params.containing_block_size!.width(),
        layout_params.shrink_to_fit_width_forced,
        widthCtxHolder.depends_on_containing_block, maybe_left,
        maybe_right, maybe_margin_left,
        maybe_margin_right, maybe_width, maybe_height);

      // If the tentative used width is greater than 'max-width', the rules above
      // are applied again, but this time using the computed value of 'max-width'
      // as the computed value for 'width'.
      //   https://www.w3.org/TR/CSS21/visudet.html#min-max-widths
      let maxWidthCtxHolder: IDependsOnContainingBlockHolder = Object.create(null)
      let maybe_max_width = GetUsedMaxWidthIfNotNone(this.computed_style()!, layout_params.containing_block_size!, maxWidthCtxHolder);
      if (maybe_max_width && this.width().GT(maybe_max_width)) {
        this.UpdateContentWidthAndMargins(
          layout_params.containing_block_direction,
          layout_params.containing_block_size!.width(),
          layout_params.shrink_to_fit_width_forced,
          maxWidthCtxHolder.depends_on_containing_block, maybe_left, maybe_right,
          maybe_margin_left, maybe_margin_right, maybe_max_width, maybe_height);
      }

      // If the resulting width is smaller than 'min-width', the rules above are
      // applied again, but this time using the value of 'min-width' as the
      // computed value for 'width'.
      //   https://www.w3.org/TR/CSS21/visudet.html#min-max-widths
      let holder: IDependsOnContainingBlockHolder = Object.create(null);
      let maybe_min_width = GetUsedMinWidthIfNotAuto(
        this.computed_style()!,
        layout_params.containing_block_size!,
        holder);
      if (maybe_min_width && (this.width().LT(maybe_min_width || new LayoutUnit()))) {
        this.UpdateContentWidthAndMargins(
          layout_params.containing_block_direction,
          layout_params.containing_block_size!.width(),
          layout_params.shrink_to_fit_width_forced,
          holder.depends_on_containing_block,
          maybe_left,
          maybe_right,
          maybe_margin_left,
          maybe_margin_right,
          maybe_min_width,
          maybe_height);
      }
    }

    this.UpdateContentHeightAndMargins(
      layout_params.containing_block_size!,
      maybe_top,
      maybe_bottom,
      maybe_margin_top,
      maybe_margin_bottom,
      maybe_height);

    // If the tentative height is greater than 'max-height', the rules above are
    // applied again, but this time using the value of 'max-height' as the
    // computed value for 'height'.
    //   https://www.w3.org/TR/CSS21/visudet.html#min-max-heights
    let maybe_max_height = GetUsedMaxHeightIfNotNone(
      this.computed_style()!, layout_params.containing_block_size!);
    if (maybe_max_height && this.height().GT(maybe_max_height)) {
      this.UpdateContentHeightAndMargins(layout_params.containing_block_size!,
        maybe_top, maybe_bottom, maybe_margin_top,
        maybe_margin_bottom, maybe_max_height);
    }

    // If the resulting height is smaller than 'min-height', the rules above are
    // applied again, but this time using the value of 'min-height' as the
    // computed value for 'height'.
    //   https://www.w3.org/TR/CSS21/visudet.html#min-max-heights
    let min_height = GetUsedMinHeightIfNotAuto(
      this.computed_style()!, layout_params.containing_block_size!);
    if (min_height && (this.height().LT(min_height))) {
      this.UpdateContentHeightAndMargins(layout_params.containing_block_size!,
        maybe_top, maybe_bottom, maybe_margin_top,
        maybe_margin_bottom, min_height);
    }
  }
  TryWrapAt(wrap_at_policy: WrapAtPolicy,
            wrap_opportunity_policy: WrapOpportunityPolicy,
            is_line_existence_justified: boolean,
            available_width: LayoutUnit,
            should_collapse_trailing_white_space: boolean): WrapResult {
    DCHECK(!this.IsAbsolutelyPositioned());
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    return WrapResult.kWrapResultNoWrap;
  }

  TrySplitAtSecondBidiLevelRun(): boolean {
    return false;
  }
  GetBidiLevel(): Optional<number> {
    return undefined;
  }

  SetShouldCollapseLeadingWhiteSpace(
    should_collapse_leading_white_space: boolean) {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    // Do nothing.
  }
  SetShouldCollapseTrailingWhiteSpace(
    should_collapse_trailing_white_space: boolean) {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    // Do nothing.
  }
  HasLeadingWhiteSpace(): boolean {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    return false;
  }
  HasTrailingWhiteSpace(): boolean {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    return false;
  }
  IsCollapsed(): boolean {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    return false;
  }

  JustifiesLineExistence(): boolean {
    DCHECK_EQ(Level.kInlineLevel, this.GetLevel());
    return true;
  }
  AffectsBaselineInBlockFormattingContext(): boolean {
    return !!this.maybe_baseline_offset_from_top_margin_edge_;

  }
  GetBaselineOffsetFromTopMarginEdge(): LayoutUnit {
    return this.maybe_baseline_offset_from_top_margin_edge_ || this.GetMarginBoxHeight();
  }

  // From |ContainerBox|.
  override TrySplitAtEnd(): Optional<ContainerBox> {
    return undefined;
  }

  base_direction() {
    return this.base_direction_;
  }

  GetShrinkToFitWidth(
    containing_block_width: LayoutUnit,
    maybe_height: Optional<LayoutUnit>): LayoutUnit {
    let child_layout_params = new LayoutParams();
    child_layout_params.containing_block_direction = this.base_direction_;
    // The available width is the width of the containing block minus
    // the used values of "margin-left", "border-left-width", "padding-left",
    // "padding-right", "border-right-width", "margin-right".
    //   https://www.w3.org/TR/CSS21/visudet.html#shrink-to-fit-float
    child_layout_params.containing_block_size.set_width(
      containing_block_width
        .SUB(this.margin_left())
        .SUB(this.border_left_width())
        .SUB(this.padding_left())
        .SUB(this.padding_right())
        .SUB(this.border_right_width())
        .SUB(this.margin_right()));
    // The "auto" height is not known yet but it shouldn't matter for in-flow
    // children, as per:
    //
    // If the height of the containing block is not specified explicitly (i.e.,
    // it depends on content height), and this element is not absolutely
    // positioned, the value [of "height"] computes to "auto".
    //   https://www.w3.org/TR/CSS21/visudet.html#the-height-property
    child_layout_params.containing_block_size.set_height(maybe_height || new LayoutUnit);
    // Although the spec does not mention it explicitly, Chromium operates under
    // the assumption that child block-level boxes must shrink instead of
    // expanding when calculating shrink-to-fit width of the parent box.
    child_layout_params.shrink_to_fit_width_forced = true;

    // Do a preliminary layout using the available width as a containing block
    // width. See |InlineFormattingContext::EndUpdates()| for details.
    //
    // TODO: Laying out the children twice has an exponential worst-case
    //       complexity (because every child could lay out itself twice as
    //       well). Figure out if there is a better way.
    let formatting_context =
      this.UpdateRectOfInFlowChildBoxes(child_layout_params);

    return formatting_context.shrink_to_fit_width();
  }

  // From |Box|.
  IsTransformable(): boolean {
    return true;
  }

  // Rest of the protected methods.

  // Lays out children recursively.
  abstract UpdateRectOfInFlowChildBoxes(
    child_layout_params: LayoutParams): FormattingContext

  private UpdateContentWidthAndMargins(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    shrink_to_fit_width_forced: boolean,
    width_depends_on_containing_block: boolean,
    maybe_left: Optional<LayoutUnit>,
    maybe_right: Optional<LayoutUnit>,
    maybe_margin_left: Optional<LayoutUnit>,
    maybe_margin_right: Optional<LayoutUnit>,
    maybe_width: Optional<LayoutUnit>,
    maybe_height: Optional<LayoutUnit>) {
    if (this.IsAbsolutelyPositioned()) {
      this.UpdateWidthAssumingAbsolutelyPositionedBox(
        containing_block_direction, containing_block_width,
        maybe_left, maybe_right, maybe_width,
        maybe_margin_left, maybe_margin_right, maybe_height);
    } else {
      let maybe_nulled_width: Optional<LayoutUnit> = maybe_width;
      let forced_level = this.GetLevel();
      if (shrink_to_fit_width_forced) {
        forced_level = Level.kInlineLevel;
        // Break circular dependency if needed.
        if (width_depends_on_containing_block) {
          maybe_nulled_width = undefined;
        }
      }

      switch (forced_level) {
        case Level.kBlockLevel:
          this.UpdateWidthAssumingBlockLevelInFlowBox(
            containing_block_direction, containing_block_width,
            maybe_nulled_width, maybe_margin_left, maybe_margin_right);
          break;
        case Level.kInlineLevel:
          this.UpdateWidthAssumingInlineLevelInFlowBox(
            containing_block_width, maybe_nulled_width, maybe_margin_left,
            maybe_margin_right, maybe_height);
          break;
      }
    }
  }
  private UpdateContentHeightAndMargins(
    containing_block_size: SizeLayoutUnit,
    maybe_top: Optional<LayoutUnit>,
    maybe_bottom: Optional<LayoutUnit>,
    maybe_margin_top: Optional<LayoutUnit>,
    maybe_margin_bottom: Optional<LayoutUnit>,
    maybe_height: Optional<LayoutUnit>) {
    let child_layout_params = new LayoutParams();
    let absolute_child_layout_params = new LayoutParams();
    child_layout_params.containing_block_direction = this.base_direction_;
    absolute_child_layout_params.containing_block_direction = this.base_direction_;
    if (this.AsAnonymousBlockBox()) {
      // Anonymous block boxes are ignored when resolving percentage values
      // that would refer to it: the closest non-anonymous ancestor box is used
      // instead.
      //   https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level
      child_layout_params.containing_block_size = containing_block_size;
    } else {
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
      // The "auto" height is not known yet but it shouldn't matter for in-flow
      // children, as per:
      //
      // If the height of the containing block is not specified explicitly (i.e.,
      // it depends on content height), and this element is not absolutely
      // positioned, the value [of "height"] computes to "auto".
      //   https://www.w3.org/TR/CSS21/visudet.html#the-height-property
      if (maybe_height) {
        child_layout_params.containing_block_size.set_height(maybe_height);
      } else if (maybe_top && maybe_bottom) {
        child_layout_params.containing_block_size.set_height(
          containing_block_size.height().SUB(maybe_top).SUB(maybe_bottom));
      } else {
        child_layout_params.containing_block_size.set_height(new LayoutUnit);
      }
    }
    child_layout_params.maybe_margin_top = maybe_margin_top;
    child_layout_params.maybe_margin_bottom = maybe_margin_bottom;
    child_layout_params.maybe_height = maybe_height;

    let formatting_context =
      this.UpdateRectOfInFlowChildBoxes(child_layout_params);

    if (this.IsAbsolutelyPositioned()) {
      this.UpdateHeightAssumingAbsolutelyPositionedBox(
        containing_block_size.height(), maybe_top, maybe_bottom, maybe_height,
        maybe_margin_top, maybe_margin_bottom, formatting_context);
    } else {
      this.UpdateHeightAssumingInFlowBox(maybe_height, maybe_margin_top,
        maybe_margin_bottom, formatting_context
      );

    }

    // Positioned children are laid out at the end as their position and size
    // depends on the size of the containing block as well as possibly their
    // previously calculated in-flow position.
    child_layout_params.containing_block_size.set_height(this.height());
    absolute_child_layout_params.containing_block_size.set_height(
      this.GetPaddingBoxHeight());

    this.UpdateRectOfPositionedChildBoxes(child_layout_params,
      absolute_child_layout_params);

    if (formatting_context.maybe_baseline_offset_from_top_content_edge()) {
      this.maybe_baseline_offset_from_top_margin_edge_ =
        this.margin_top()
          .ADD(this.border_top_width())
          .ADD(this.padding_top())
          .ADD(formatting_context.maybe_baseline_offset_from_top_content_edge()!);
    } else {
      this.maybe_baseline_offset_from_top_margin_edge_ = undefined;
    }
  }

  private UpdateWidthAssumingAbsolutelyPositionedBox(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    maybe_left: Optional<LayoutUnit>,
    maybe_right: Optional<LayoutUnit>,
    maybe_width: Optional<LayoutUnit>,
    maybe_margin_left: Optional<LayoutUnit>,
    maybe_margin_right: Optional<LayoutUnit>,
    maybe_height: Optional<LayoutUnit>) {
    // If all three of "left", "width", and "right" are "auto":
    if (!maybe_left && !maybe_width && !maybe_right) {
      // First set any "auto" values for "margin-left" and "margin-right" to 0.
      this.set_margin_left(maybe_margin_left || new LayoutUnit());
      this.set_margin_right(maybe_margin_right || new LayoutUnit());

      // Then, if the "direction" property of the element establishing the
      // static-position containing block is "ltr"...
      if (containing_block_direction == BaseDirection.kLeftToRightBaseDirection) {
        // ...set "left" to the static position...
        this.set_left(this.GetStaticPositionLeft());

        // ...and apply rule number three (the width is shrink-to-fit; solve for
        // "right").
        this.set_width(this.GetShrinkToFitWidth(containing_block_width, maybe_height));
      } else {
        // ...otherwise, set "right" to the static position...
        // ...and apply rule number one (the width is shrink-to-fit; solve for
        // "left").
        this.set_width(this.GetShrinkToFitWidth(containing_block_width, maybe_height));
        this.set_left(containing_block_width.SUB(this.GetStaticPositionRight()).SUB(this.GetMarginBoxWidth()));
      }
      return;
    }

    // If none of the three is "auto":
    if (maybe_left && maybe_width && maybe_right) {
      this.set_left(maybe_left);
      this.set_width(maybe_width);

      let horizontal_margin_sum = containing_block_width.SUB(maybe_left).SUB(this.GetBorderBoxWidth()).SUB(maybe_right);

      if (!maybe_margin_left && !maybe_margin_right) {
        // If both "margin-left" and "margin-right" are "auto", solve the equation
        // under the extra constraint that the two margins get equal values...
        let horizontal_margin = horizontal_margin_sum.DIV(2);
        if (horizontal_margin.LT(new LayoutUnit())) {
          // ...unless this would make them negative, in which case when direction
          // of the containing block is "ltr" ("rtl"), set "margin-left"
          // ("margin-right") to zero and solve for "margin-right"
          // ("margin-left").
          if (containing_block_direction == BaseDirection.kLeftToRightBaseDirection) {
            this.set_margin_left(new LayoutUnit());
            this.set_margin_right(horizontal_margin_sum);
          } else {
            this.set_margin_left(horizontal_margin_sum);
            this.set_margin_right(new LayoutUnit());
          }
        } else {
          this.set_margin_left(horizontal_margin);
          this.set_margin_right(horizontal_margin);
        }
      } else if (!maybe_margin_left) {
        // If one of "margin-left" or "margin-right" is "auto", solve the equation
        // for that value.
        this.set_margin_left(horizontal_margin_sum.SUB(maybe_margin_right!));
        this.set_margin_right(maybe_margin_right!);
      } else if (!maybe_margin_right) {
        // If one of "margin-left" or "margin-right" is "auto", solve the equation
        // for that value.
        this.set_margin_left(maybe_margin_left);
        this.set_margin_right(horizontal_margin_sum.SUB(maybe_margin_left));
      } else {
        // If the values are over-constrained, ignore the value for "left" (in
        // case the "direction" property of the containing block is "rtl") or
        // "right" (in case "direction" is "ltr") and solve for that value.
        this.set_margin_left(maybe_margin_left);
        this.set_margin_right(maybe_margin_right);
        if (containing_block_direction == BaseDirection.kRightToLeftBaseDirection) {
          this.set_left(containing_block_width.SUB(this.GetMarginBoxWidth()).SUB(maybe_right));
        }
      }
      return;
    }

    // Otherwise, set "auto" values for "margin-left" and "margin-right" to 0...
    this.set_margin_left(maybe_margin_left || new LayoutUnit());
    this.set_margin_right(maybe_margin_right || new LayoutUnit());

    // ...and pick the one of the following six rules that applies.

    // 1. "left" and "width" are "auto" and "right" is not "auto"...
    if (!maybe_left && !maybe_width && maybe_right) {
      // ...then the width is shrink-to-fit.
      this.set_width(this.GetShrinkToFitWidth(containing_block_width, maybe_height));
      // Then solve for "left".
      this.set_left(containing_block_width.SUB(this.GetMarginBoxWidth()).SUB(maybe_right));
      return;
    }

    // 2. "left" and "right" are "auto" and "width" is not "auto"...
    if (!maybe_left && !maybe_right && maybe_width) {
      this.set_width(maybe_width);
      // ...if the "direction" property of the element establishing the
      // static-position containing block is "ltr" set "left" to the static
      // position, otherwise set "right" to the static position. Then solve for
      // "left" (if "direction" is "rtl") or "right" (if "direction" is "ltr").
      if (containing_block_direction == BaseDirection.kLeftToRightBaseDirection) {
        this.set_left(this.GetStaticPositionLeft());
      } else {
        this.set_left(containing_block_width.SUB(this.GetStaticPositionRight()).SUB(this.GetMarginBoxWidth()));
      }
      // DCHECK_EQ(left(), left());  // Check for NaN.
      return;
    }

    // 3. "width" and "right" are "auto" and "left" is not "auto"...
    if (!maybe_width && !maybe_right && maybe_left) {
      this.set_left(maybe_left);
      // ...then the width is shrink-to-fit.
      this.set_width(this.GetShrinkToFitWidth(containing_block_width, maybe_height));
      return;
    }

    // 4. "left" is "auto", "width" and "right" are not "auto"...
    if (!maybe_left && maybe_width && maybe_right) {
      this.set_width(maybe_width);
      // ...then solve for "left".
      this.set_left(containing_block_width.SUB(this.GetMarginBoxWidth()).SUB(maybe_right));
      return;
    }

    // 5. "width" is "auto", "left" and "right" are not "auto"...
    if (!maybe_width && maybe_left && maybe_right) {
      this.set_left(maybe_left);
      // ...then solve for "width".
      this.set_width(containing_block_width
        .SUB(maybe_left)
        .SUB(this.margin_left())
        .SUB(this.border_left_width())
        .SUB(this.padding_left())
        .SUB(this.padding_right())
        .SUB(this.border_right_width())
        .SUB(this.margin_right())
        .SUB(maybe_right)
      );
      return;
    }

    // 6. "right" is "auto", "left" and "width" are not "auto".
    if (!maybe_right && maybe_left && maybe_width) {
      this.set_left(maybe_left);
      this.set_width(maybe_width);
      return;
    }
  }
  private UpdateHeightAssumingAbsolutelyPositionedBox(
    containing_block_height: LayoutUnit,
    maybe_top: Optional<LayoutUnit>,
    maybe_bottom: Optional<LayoutUnit>,
    maybe_height: Optional<LayoutUnit>,
    maybe_margin_top: Optional<LayoutUnit>,
    maybe_margin_bottom: Optional<LayoutUnit>,
    formatting_context: FormattingContext) {
    // If all three of "top", "height", and "bottom" are "auto":
    if (!maybe_top && !maybe_height && !maybe_bottom) {
      // First set any "auto" values for "margin-top" and "margin-bottom" to 0.
      this.set_margin_top(maybe_margin_top || new LayoutUnit);
      this.set_margin_bottom(maybe_margin_bottom || new LayoutUnit);

      // Then set "top" to the static position...
      this.set_top(this.GetStaticPositionTop());
      // DCHECK_EQ(top(), top());  // Check for NaN.

      // ...and apply rule number three (the height is based on the content).
      this.set_height(formatting_context.auto_height());
      return;
    }

    // If none of the three is "auto":
    if (maybe_top && maybe_height && maybe_bottom) {
      this.set_top(maybe_top);
      this.set_height(maybe_height);

      let vertical_margin_sum = containing_block_height.SUB(maybe_top).SUB(this.GetBorderBoxHeight()).SUB(maybe_bottom);

      if (!maybe_margin_top && !maybe_margin_bottom) {
        // If both "margin-top" and "margin-bottom" are "auto", solve the equation
        // under the extra constraint that the two margins get equal values...
        let vertical_margin = vertical_margin_sum.DIV(2);
        this.set_margin_top(vertical_margin);
        this.set_margin_bottom(vertical_margin);
      } else if (!maybe_margin_top) {
        // If one of "margin-top" or "margin-bottom" is "auto", solve the equation
        // for that value.
        DCHECK(maybe_margin_bottom);
        this.set_margin_top(vertical_margin_sum.SUB(maybe_margin_bottom!));
        this.set_margin_bottom(maybe_margin_bottom!);
      } else if (!maybe_margin_bottom) {
        // If one of "margin-top" or "margin-bottom" is "auto", solve the equation
        // for that value.
        this.set_margin_top(maybe_margin_top);
        this.set_margin_bottom(vertical_margin_sum.SUB(maybe_margin_top));
      } else {
        // If the values are over-constrained, ignore the value for "bottom".
        this.set_margin_top(maybe_margin_top);
        this.set_margin_bottom(maybe_margin_bottom);
      }
      return;
    }

    // Otherwise, set "auto" values for "margin-top" and "margin-bottom" to 0...
    this.set_margin_top(maybe_margin_top || new LayoutUnit);
    this.set_margin_bottom(maybe_margin_bottom || new LayoutUnit);

    // ...and pick the one of the following six rules that applies.

    // 1. "top" and "height" are "auto" and "bottom" is not "auto"...
    if (!maybe_top && !maybe_height && maybe_bottom) {
      // ...then the height is based on the content.
      this.set_height(formatting_context.auto_height());
      // Then solve for "top".
      this.set_top(containing_block_height.SUB(this.GetMarginBoxHeight()).SUB(maybe_bottom));
      return;
    }

    // 2. "top" and "bottom" are "auto" and "height" is not "auto"...
    if (!maybe_top && !maybe_bottom && maybe_height) {
      this.set_height(maybe_height);
      // ...then set "top" to the static position.
      this.set_top(this.GetStaticPositionTop());
      // DCHECK_EQ(top(), top());  // Check for NaN.
      return;
    }

    // 3. "height" and "bottom" are "auto" and "top" is not "auto"...
    if (!maybe_height && !maybe_bottom && maybe_top) {
      this.set_top(maybe_top);
      // ...then the height is based on the content.
      this.set_height(formatting_context.auto_height());
      return;
    }

    // 4. "top" is "auto", "height" and "bottom" are not "auto"...
    if (!maybe_top && maybe_height && maybe_bottom) {
      this.set_height(maybe_height);
      // ...then solve for "top".
      this.set_top(containing_block_height.SUB(this.GetMarginBoxHeight()).SUB(maybe_bottom));
      return;
    }

    // 5. "height" is "auto", "top" and "bottom" are not "auto"...
    if (!maybe_height && maybe_top && maybe_bottom) {
      this.set_top(maybe_top);
      // ...then solve for "height".
      this.set_height(containing_block_height
        .SUB(maybe_top)
        .SUB(this.margin_top())
        .SUB(this.border_top_width())
        .SUB(this.padding_top())
        .SUB(this.padding_bottom())
        .SUB(this.border_bottom_width())
        .SUB(this.margin_bottom())
        .SUB(maybe_bottom)
      );
      return;
    }

    // 6. "bottom" is "auto", "top" and "height" are not "auto".
    if (!maybe_bottom && maybe_top && maybe_height) {
      this.set_top(maybe_top);
      this.set_height(maybe_height);
      return;
    }
  }

  private UpdateWidthAssumingBlockLevelInFlowBox(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    maybe_width: Optional<LayoutUnit>,
    possibly_overconstrained_margin_left: Optional<LayoutUnit>,
    possibly_overconstrained_margin_right: Optional<LayoutUnit>) {
    let maybe_margin_left =
      possibly_overconstrained_margin_left;
    let maybe_margin_right =
      possibly_overconstrained_margin_right;

    if (maybe_width) {
      this.set_width(maybe_width);
      this.UpdateHorizontalMarginsAssumingBlockLevelInFlowBox(
        containing_block_direction, containing_block_width, this.GetBorderBoxWidth(),
        maybe_margin_left, maybe_margin_right);
    } else {
      // If "width" is set to "auto", any other "auto" values become "0" and
      // "width" follows from the resulting equality.
      this.set_margin_left(maybe_margin_left || new LayoutUnit());
      this.set_margin_right(maybe_margin_right || new LayoutUnit());

      let val = containing_block_width
        .SUB(this.margin_left())
        .SUB(this.border_left_width())
        .SUB(this.padding_left())
        .SUB(this.padding_right())
        .SUB(this.border_right_width())
        .SUB(this.margin_right());
      this.set_width(containing_block_width
        .SUB(this.margin_left())
        .SUB(this.border_left_width())
        .SUB(this.padding_left())
        .SUB(this.padding_right())
        .SUB(this.border_right_width())
        .SUB(this.margin_right()));
    }
  }
  private UpdateWidthAssumingInlineLevelInFlowBox(
    containing_block_width: LayoutUnit,
    maybe_width: Optional<LayoutUnit>,
    maybe_margin_left: Optional<LayoutUnit>,
    maybe_margin_right: Optional<LayoutUnit>,
    maybe_height: Optional<LayoutUnit>) {
    // A computed value of "auto" for "margin-left" or "margin-right" becomes
    // a used value of "0".
    //   https://www.w3.org/TR/CSS21/visudet.html#inlineblock-width
    this.set_margin_left(maybe_margin_left || new LayoutUnit());
    this.set_margin_right(maybe_margin_right || new LayoutUnit());

    if (!maybe_width) {
      // If "width" is "auto", the used value is the shrink-to-fit width.
      //   https://www.w3.org/TR/CSS21/visudet.html#inlineblock-width
      this.set_width(this.GetShrinkToFitWidth(containing_block_width, maybe_height));
    } else {
      this.set_width(maybe_width);
    }
  }

  private UpdateHeightAssumingInFlowBox(
    maybe_height: Optional<LayoutUnit>,
    maybe_margin_top: Optional<LayoutUnit>,
    maybe_margin_bottom: Optional<LayoutUnit>,
    formatting_context: FormattingContext) {
    if (this.collapsed_empty_margin_) {
      // If empty box has a collapsed margin, only set top margin.
      //   https://www.w3.org/TR/CSS22/box.html#collapsing-margins
      this.set_margin_top(this.collapsed_empty_margin_);
      this.set_margin_bottom(new LayoutUnit());
    } else {
      // If "margin-top", or "margin-bottom" are "auto", their used value is 0.
      let margin_top =
        this.collapsed_margin_top_ || maybe_margin_top || new LayoutUnit();
      let margin_bottom = this.collapsed_margin_bottom_ ||
        maybe_margin_bottom || new LayoutUnit();
      this.set_margin_top(margin_top);
      this.set_margin_bottom(margin_bottom);
    }

    // If "height" is "auto", the used value is the distance from box's top
    // content edge to the first applicable of the following:
    //     1. the bottom edge of the last line box, if the box establishes
    //        an inline formatting context with one or more lines;
    //     2. the bottom edge of the bottom margin of its last in-flow child.
    this.set_height(maybe_height || formatting_context.auto_height());
  }

  DumpProperties(stream: string): string {
    stream = super.DumpProperties(stream);

    stream += 'affects_baseline_in_block_formatting_context=';
    stream += this.AffectsBaselineInBlockFormattingContext();
    stream += ' ';
    return stream;
  }

  AbsoluteQuadsForSelf(quads: QuadF[], mode: MapCoordinatesFlags) {
    this.QuadsForSelfInternal(quads, mode, true);
  }

  QuadsForSelfInternal(quads: QuadF[], mode: MapCoordinatesFlags, map_to_absolute: boolean) {
    let local_rect = this.BorderBoxRect()
    if (map_to_absolute) {
      const border_box = this.GetBorderBoxFromRoot(false)
      quads.push(QuadF.fromRectF(RectF.fromRectLayoutUnit(border_box)))
    } else {
      const border_box = this.BorderBoxRect()
      quads.push(QuadF.fromRectF(RectF.fromRectLayoutUnit(border_box)))
    }
  }
}
