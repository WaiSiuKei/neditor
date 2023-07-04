import { Optional } from '@neditor/core/base/common/typescript';
import { LayoutUnit } from './layout_unit';
import { FormattingContext } from './formatting_context';
import { Box, LayoutParams, Level, MarginCollapsingStatus } from './box';
import { DCHECK } from '@neditor/core/base/check';
import { DCHECK_EQ } from '@neditor/core/base/check_op';

class MarginCollapsingParams {
  collapsing_margin = new LayoutUnit();
  context_margin_top: Optional<LayoutUnit>;
  should_collapse_own_margins_together = true;
  should_collapse_margin_bottom = true;
  should_collapse_margin_top: boolean;
  constructor(is_margin_collapsible: boolean) {
    this.should_collapse_margin_top = is_margin_collapsible;
  }
};

// In a block formatting context, boxes are laid out one after the other,
// vertically, beginning at the top of a containing block.
//   https://www.w3.org/TR/CSS21/visuren.html#block-formatting
//
// A block formatting context is a short-lived object that is constructed
// and destroyed during the layout. The block formatting context does not own
// child boxes nor triggers their layout - it is a responsibility of the box
// that establishes this formatting context. This class merely knows how
// to update the position of the subsequent children passed to it.
export class BlockFormattingContext extends FormattingContext {
  private layout_params_: LayoutParams;
  private margin_collapsing_params_: MarginCollapsingParams;
  constructor(
    layout_params: LayoutParams,
    is_margin_collapsible: boolean,
  ) {
    super();
    this.layout_params_ = layout_params;
    this.margin_collapsing_params_ = new MarginCollapsingParams(is_margin_collapsible);
  }

  // Updates the top and bottom margins of the containing box after children
  // have been processed.
  CollapseContainingMargins(containing_box: Box) {
    let has_padding_top = containing_box.padding_top() != new LayoutUnit();
    let has_border_top = containing_box.border_top_width() != new LayoutUnit();
    let has_padding_bottom = containing_box.padding_bottom() != new LayoutUnit();
    let has_border_bottom =
      containing_box.border_bottom_width() != new LayoutUnit();
    let margin_top =
      this.layout_params_.maybe_margin_top || new LayoutUnit();
    let margin_bottom =
      this.layout_params_.maybe_margin_bottom || new LayoutUnit();

    // If no in-flow children, do not collapse margins with children.
    if (!this.margin_collapsing_params_.context_margin_top) {
      // Empty boxes with auto or 0 height collapse top/bottom margins together.
      //   https://www.w3.org/TR/CSS22/box.html#collapsing-margins
      if (!has_padding_top && !has_border_top && !has_padding_bottom &&
        !has_border_bottom &&
        this.layout_params_.containing_block_size.height() == new LayoutUnit() &&
        this.margin_collapsing_params_.should_collapse_own_margins_together) {
        containing_box.collapsed_empty_margin_ =
          this.CollapseMargins(margin_top, margin_bottom);
        return;
      }
      // Reset in case min-height iteration reverses 0/auto height criteria.
      containing_box.collapsed_empty_margin_ = undefined;
      return;
    }

    // Collapse top margin with top margin of first in-flow child.
    if (!has_padding_top && !has_border_top &&
      this.margin_collapsing_params_.should_collapse_margin_top) {
      let collapsed_margin_top = this.CollapseMargins(
        margin_top,
        this.margin_collapsing_params_.context_margin_top || new LayoutUnit());
      containing_box.collapsed_margin_top_ = collapsed_margin_top;
    }

    // If height is auto, collapse bottom margin with bottom margin of last
    // in-flow child.
    if (!this.layout_params_.maybe_height && !has_padding_bottom &&
      !has_border_bottom &&
      this.margin_collapsing_params_.should_collapse_margin_bottom) {
      let collapsed_margin_bottom = this.CollapseMargins(
        margin_bottom, this.margin_collapsing_params_.collapsing_margin);
      containing_box.collapsed_margin_bottom_ = collapsed_margin_bottom;
      this.set_auto_height(this.auto_height().SUB(this.margin_collapsing_params_.collapsing_margin));
    }
  }

  // Calculates the position and size of the given child box and updates
  // the internal state in the preparation for the next child.
  UpdateRect(child_box: Box) {
    DCHECK(!child_box.IsAbsolutelyPositioned());

    child_box.UpdateSize(this.layout_params_);

    // In a block formatting context, each box's left outer edge touches
    // the left edge of the containing block.
    //   https://www.w3.org/TR/CSS21/visuren.html#block-formatting
    child_box.set_left(new LayoutUnit());
    this.UpdatePosition(child_box);

    // Shrink-to-fit width cannot be less than the width of the widest child.
    //   https://www.w3.org/TR/CSS21/visudet.html#float-width
    this.set_shrink_to_fit_width(
      LayoutUnit.Max(this.shrink_to_fit_width(),
        child_box.GetMarginBoxRightEdgeOffsetFromContainingBlock()));

    // If "height" is "auto", the used value is the distance from box's top
    // content edge to the bottom edge of the bottom margin of its last in-flow
    // child.
    //   https://www.w3.org/TR/CSS21/visudet.html#normal-block
    this.set_auto_height(child_box.GetMarginBoxBottomEdgeOffsetFromContainingBlock());

    // The baseline of an "inline-block" is the baseline of its last line box
    // in the normal flow, unless it has no in-flow line boxes.
    //   https://www.w3.org/TR/CSS21/visudet.html#line-height
    if (child_box.AffectsBaselineInBlockFormattingContext()) {
      this.set_baseline_offset_from_top_content_edge(
        child_box.top().ADD(child_box.GetBaselineOffsetFromTopMarginEdge()));
    }
  }

  private UpdatePosition(child_box: Box) {
    DCHECK_EQ(Level.kBlockLevel, child_box.GetLevel());

    switch (child_box.GetMarginCollapsingStatus()) {
      case MarginCollapsingStatus.kIgnore:
        child_box.set_top(this.auto_height());
        break;
      case  MarginCollapsingStatus.kSeparateAdjoiningMargins:
        child_box.set_top(this.auto_height());
        this.margin_collapsing_params_.collapsing_margin = new LayoutUnit();
        this.margin_collapsing_params_.should_collapse_margin_bottom = false;
        if (!this.margin_collapsing_params_.context_margin_top) {
          this.margin_collapsing_params_.should_collapse_margin_top = false;
        }
        this.margin_collapsing_params_.should_collapse_own_margins_together = false;
        break;
      case MarginCollapsingStatus.kCollapseMargins:
        this.margin_collapsing_params_.should_collapse_margin_bottom = true;

        // For first child, if top margin will collapse with parent's top margin,
        // parent will handle margin positioning for both itself and the child.
        if (!this.margin_collapsing_params_.context_margin_top &&
          this.margin_collapsing_params_.should_collapse_margin_top) {
          child_box.set_top(this.auto_height().SUB(child_box.margin_top()));
          if (child_box.collapsed_empty_margin_) {
            this.margin_collapsing_params_.should_collapse_margin_bottom = false;
          }
        } else {
          // Collapse top margin with previous sibling's bottom margin.
          let collapsed_margin =
            this.CollapseMargins(child_box.margin_top(),
              this.margin_collapsing_params_.collapsing_margin);
          let combined_margin =
            this.margin_collapsing_params_.collapsing_margin.ADD(child_box.margin_top());
          let position_difference = combined_margin.SUB(collapsed_margin);
          child_box.set_top(this.auto_height().SUB(position_difference));
        }

        // Collapse margins for in-flow siblings.
        this.margin_collapsing_params_.collapsing_margin =
          child_box.collapsed_empty_margin_ || child_box.margin_bottom();
        if (!this.margin_collapsing_params_.context_margin_top) {
          this.margin_collapsing_params_.context_margin_top = child_box.margin_top();
        }
        break;
    }
  }
  private CollapseMargins(box_margin: LayoutUnit,
                          adjoining_margin: LayoutUnit): LayoutUnit {
// In a block formatting context, boxes are laid out one after the other,
    // vertically, beginning at the top of a containing block. The vertical
    // distance between two sibling boxes is determined by the "margin"
    // properties. Vertical margins between adjacent block-level boxes in a block
    // formatting context collapse.
    //   https://www.w3.org/TR/CSS21/visuren.html#block-formatting

    // When two or more margins collapse, the resulting margin width is the
    // maximum of the collapsing margins' widths.
    //   https://www.w3.org/TR/CSS21/box.html#collapsing-margins
    let collapsed_margin = new LayoutUnit();
    if ((box_margin.GE(new LayoutUnit())) && (adjoining_margin.GE(new LayoutUnit()))) {
      collapsed_margin = LayoutUnit.Max(box_margin, adjoining_margin);
    } else if ((box_margin.LT(new LayoutUnit())) && (adjoining_margin.LT(new LayoutUnit()))) {
      // If there are no positive margins, the maximum of the absolute values of
      // the adjoining margins is deducted from zero.
      collapsed_margin = (new LayoutUnit()).ADD(LayoutUnit.Min(box_margin, adjoining_margin));
    } else {
      // In the case of negative margins, the maximum of the absolute values of
      // the negative adjoining margins is deducted from the maximum of the
      // positive adjoining margins.
      // When there is only one negative and one positive margin, that translates
      // to: The margins are summed.
      DCHECK(adjoining_margin.GE(new LayoutUnit()) ||
        box_margin.GE(new LayoutUnit()));
      collapsed_margin = adjoining_margin.ADD(box_margin);
    }

    return collapsed_margin;
  }
};
