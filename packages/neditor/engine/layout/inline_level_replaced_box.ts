import { ReplacedBox, ReplacedBoxMode, ReplaceImageCB } from './replaced_box';
import { LayoutUnit } from './layout_unit';
import { UsedStyleProvider } from './used_style';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { Optional } from '@neditor/core/base/common/typescript';
import { SizeF } from '../math/size_f';
import { Level } from './box';
import { BaseDirection } from './base_direction';
import { IReference } from "../../base/common/lifecycle";
import { Paragraph } from "./paragraph";

export class InlineLevelReplacedBox<T> extends ReplacedBox<T> {

  // This flag indicates that the box is fully hidden by the ellipsis and it,
  // along with its contents will not be visible.
  // "Implementations must hide characters and atomic inline-level elements at
  // the applicable edge(s) of the line as necessary to fit the ellipsis."
  //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
  is_hidden_by_ellipsis_: boolean;
  // Tracking of the previous value of |is_hidden_by_ellipsis_|, which allows
  // for determination of whether or not the value changed during ellipsis
  // placement. When this occurs, the cached render tree nodes of this box and
  // its ancestors are invalidated.
  was_hidden_by_ellipsis_: boolean;
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    content: T,
    paragraph_ref: IReference<Paragraph>,
    text_position: number,
    maybe_intrinsic_width: Optional<LayoutUnit>,
    maybe_intrinsic_height: Optional<LayoutUnit>,
    maybe_intrinsic_ratio: Optional<number>,
    used_style_provider: UsedStyleProvider,
    replaced_box_mode: Optional<ReplacedBoxMode>,
    content_size: SizeF,
    // layout_stat_tracker: LayoutStatTracker
  ) {
    super(css_computed_style_declaration,
      content,
      paragraph_ref,
      text_position,
      maybe_intrinsic_width,
      maybe_intrinsic_height,
      maybe_intrinsic_ratio,
      used_style_provider,
      replaced_box_mode,
      content_size
    );
    this.is_hidden_by_ellipsis_ = false;
    this.was_hidden_by_ellipsis_ = false;
  }

  override GetLevel() {
    return Level.kInlineLevel;
  }

  DoesFulfillEllipsisPlacementRequirement() {
    // This box fulfills the requirement that the first character or inline-level
    // element must appear on the line before ellipsing can occur
    // (https://www.w3.org/TR/css3-ui/#propdef-text-overflow).
    return true;
  }

  DoPreEllipsisPlacementProcessing() {
    this.was_hidden_by_ellipsis_ = this.is_hidden_by_ellipsis_;
    this.is_hidden_by_ellipsis_ = false;
  }

  DoPostEllipsisPlacementProcessing() {
    if (this.was_hidden_by_ellipsis_ != this.is_hidden_by_ellipsis_) {
      this.InvalidateRenderTreeNodesOfBoxAndAncestors();
    }
  }

  IsHiddenByEllipsis() {
    return this.is_hidden_by_ellipsis_;
  }

  UpdateHorizontalMargins(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    border_box_width: LayoutUnit,
    maybe_margin_left: Optional<LayoutUnit>,
    maybe_margin_right: Optional<LayoutUnit>) {

    // A computed value of "auto" for "margin-left" or "margin-right" becomes
    // a used value of "0".
    //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width
    this.set_margin_left(maybe_margin_left || new LayoutUnit);
    this.set_margin_right(maybe_margin_right || new LayoutUnit());
  }

  DumpClassName(stream: string): string {
    stream += 'InlineLevelReplacedBox ';
    return stream;
  }

  DoPlaceEllipsisOrProcessPlacedEllipsis(
    base_direction: BaseDirection,
    desired_offset: LayoutUnit,
    is_placement_requirement_met_input: boolean,
    is_placed_input: boolean,
    placed_offset_input: LayoutUnit) {
    let is_placed = is_placed_input;
    let placed_offset = placed_offset_input;
    let is_placement_requirement_met = is_placement_requirement_met_input;
    // If the ellipsis is already placed, then simply mark the box as hidden by
    // the ellipsis: "Implementations must hide characters and atomic inline-level
    // elements at the applicable edge(s) of the line as necessary to fit the
    // ellipsis."
    //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
    if (is_placed_input) {
      this.is_hidden_by_ellipsis_ = true;
      // Otherwise, the box is placing the ellipsis.
    } else {

      is_placed = true;

      // The first character or atomic inline-level element on a line must be
      // clipped rather than ellipsed.
      //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
      // If this requirement has been met, then place the ellipsis at the start
      // edge of atomic inline-level element, as it should be fully hidden.
      if (is_placement_requirement_met_input) {
        placed_offset =
          this.GetMarginBoxStartEdgeOffsetFromContainingBlock(base_direction);
        this.is_hidden_by_ellipsis_ = true;
        // Otherwise, this box is fulfilling the required first inline-level
        // element and the ellipsis must be added at the end edge.
      } else {
        placed_offset =
          this.GetMarginBoxEndEdgeOffsetFromContainingBlock(base_direction);
      }
    }

    return {
      is_placement_requirement_met,
      is_placed,
      placed_offset,
    };
  }
}
