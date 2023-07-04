// A base class for block and inline formatting contexts.
import { Optional } from '@neditor/core/base/common/typescript';
import { LayoutUnit } from './layout_unit';

export class FormattingContext {

  private shrink_to_fit_width_: LayoutUnit = new LayoutUnit();
  private auto_height_: LayoutUnit = new LayoutUnit();
  private maybe_baseline_offset_from_top_content_edge_: Optional<LayoutUnit>;

  // Used to calculate the "auto" width of the box that establishes this
  // formatting context.
  shrink_to_fit_width() { return this.shrink_to_fit_width_; }

  // Used to calculate the "auto" height of the box that establishes this
  // formatting context.
  auto_height() { return this.auto_height_; }

  // A vertical offset of the baseline relatively to the origin of the block
  // container box.
  //
  // In a block formatting context this is the baseline of the last child box
  // that has one. Disengaged, if none of the child boxes have a baseline.
  //
  // In an inline formatting context this is the baseline of the last line box.
  // Disengaged, if there are no line boxes that affect the layout (for example,
  // empty line boxes are discounted).
  maybe_baseline_offset_from_top_content_edge() {
    return this.maybe_baseline_offset_from_top_content_edge_;
  }

  protected set_shrink_to_fit_width(shrink_to_fit_width: LayoutUnit) {
    this.shrink_to_fit_width_ = shrink_to_fit_width;
  }

  protected set_auto_height(auto_height: LayoutUnit) { this.auto_height_ = auto_height; }

  protected set_baseline_offset_from_top_content_edge(
    baseline_offset_from_top_content_edge: LayoutUnit) {
    this.maybe_baseline_offset_from_top_content_edge_ =
      baseline_offset_from_top_content_edge;
  }
}
