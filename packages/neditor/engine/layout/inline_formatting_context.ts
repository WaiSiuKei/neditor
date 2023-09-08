import { FormattingContext } from './formatting_context';
import { Optional } from '@neditor/core/base/common/typescript';
import { BaseDirection } from './base_direction';
import { Box, LayoutParams } from './box';
import { FontMetrics } from '../render_tree/font';
import { Vector2dF } from '../math/vector2d_f';
import { LayoutUnit } from './layout_unit';
import { LineBox } from './line_box';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { PropertyValue } from '../cssom/property_value';
import { DCHECK } from '../../base/check';

// In an inline formatting context, boxes are laid out horizontally, one
// after the other, beginning at the top of a containing block. When several
// inline-level boxes cannot fit horizontally within a single line box,
// they are distributed among two or more vertically-stacked line boxes.
//   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
//
// An inline formatting context is a short-lived object that is constructed
// and destroyed during the layout. The inline formatting context does not own
// child boxes nor triggers their layout - it is a responsibility of the box
// that establishes this formatting context. This class merely knows how to
// update the position of children passed to it.
//
// To ensure that the inline formatting context has completed all calculations,
// |EndUpdates| must be called after all of the child boxes have been
// successfully added.
export class InlineFormattingContext extends FormattingContext {
  private line_height_: PropertyValue;
  private font_metrics_: FontMetrics;
  private layout_params_: LayoutParams;
  private base_direction_: BaseDirection;
  private text_align_: PropertyValue;
  private font_size_: PropertyValue;
  private text_indent_offset_: LayoutUnit;
  private ellipsis_width_: LayoutUnit;
  private text_path_: PropertyValue;
  // The inline formatting context only keeps the last line box, which may be
  // NULL if no child boxes were seen.
  private line_box_: Optional<LineBox>;

  // Number of lines boxes that affect the layout.
  private line_count_: number;

  // A width of the block container box when all possible line breaks are made.
  private preferred_min_width_: LayoutUnit = new LayoutUnit;

  private ellipses_coordinates_: Vector2dF[] = [];
  private glyph_offset_: LayoutUnit = new LayoutUnit();
  constructor(
    line_height: PropertyValue,
    font_metrics: FontMetrics,
    layout_params: LayoutParams,
    base_direction: BaseDirection,
    text_align: PropertyValue,
    font_size: PropertyValue,
    text_indent_offset: LayoutUnit,
    ellipsis_width: LayoutUnit,
    text_path: PropertyValue,
  ) {
    super();
    this.line_height_ = line_height;
    this.font_metrics_ = font_metrics;
    this.layout_params_ = layout_params;
    this.base_direction_ = base_direction;
    this.text_align_ = text_align;
    this.font_size_ = font_size;
    this.text_indent_offset_ = text_indent_offset;
    this.ellipsis_width_ = ellipsis_width;
    this.text_path_ = text_path;
    this.line_count_ = 0;
    this.CreateLineBox();
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
  // additional child boxes that were not already placed on the line.
  //
  // This call asynchronously calculates the positions and sizes of the added
  // child boxes. The used values will be undefined until |EndUpdates| is
  // called.
  TryAddChildAndMaybeWrap(child_box: Box): Box {
// When an inline box exceeds the width of a line box, it is split into
    // several boxes and these boxes are distributed across several line boxes.
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
    //
    // We tackle this problem one line at a time.

    DCHECK(this.line_box_);
    let child_box_before_wrap = this.line_box_.TryAddChildAndMaybeWrap(child_box);
    // If |child_box_before_wrap| is non-NULL, then a line wrap has occurred and a
    // new line box must be created.
    if (child_box_before_wrap) {
      this.CreateLineBox();
    }
    return child_box_before_wrap!;
  }
  // Ensures that the calculation of used values for all previously seen child
  // boxes is completed.
  EndUpdates() {
    // Treat the end of child boxes almost as an explicit line break,
    // but don't create the new line box.
    this.DestroyLineBox();

    // The shrink-to-fit width is:
    // min(max(preferred minimum width, available width), preferred width).
    //   https://www.w3.org/TR/CSS21/visudet.html#float-width
    //
    // Naive solution of the above expression would require two layout passes:
    // one to calculate the "preferred minimum width" and another one to
    // calculate the "preferred width". It is possible to save one layout pass
    // taking into account that:
    //   - an exact value of "preferred width" does not matter if "available
    //     width" cannot accommodate it;
    //   - the inline formatting context has more than one line if and only if
    //     the "preferred width" is greater than the "available width";
    //   - "preferred minimum" and "preferred" widths are equal when an inline
    //     formatting context has only one line.
    this.set_shrink_to_fit_width(LayoutUnit.Max(
      this.preferred_min_width_, this.line_count_ > 1
        ? this.layout_params_.containing_block_size.width()
        : new LayoutUnit()));
  }

  GetEllipsesCoordinates() {
    return this.ellipses_coordinates_;
  }

  // WARNING: All public getters from |FormattingContext| may be called only
  //          after |EndUpdates|.

  private CreateLineBox() {
    if (this.line_box_) {
      this.DestroyLineBox();
    }

    // "'Text-indent' only affects a line if it is the first formatted line of an
    // element."
    //   https://www.w3.org/TR/CSS21/text.html#propdef-text-indent
    let line_indent_offset = this.line_count_ == 0 ? this.text_indent_offset_ : new LayoutUnit();

    // Line boxes are stacked with no vertical separation and they never
    // overlap.
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
    this.line_box_ = new LineBox(
      this.auto_height(),
      false,
      this.line_height_,
      this.font_metrics_,
      true,
      true,
      this.layout_params_,
      this.base_direction_,
      this.text_align_,
      this.font_size_,
      line_indent_offset.CLONE(),
      this.ellipsis_width_,
      this.text_path_,
      (val: LayoutUnit) => {
        this.glyph_offset_ = val;
      },
      () => this.glyph_offset_,
    );
  }
  private DestroyLineBox() {
    if (!this.line_box_) {
      NOTREACHED();
    }
    this.line_box_.EndUpdates();

    // The baseline of an "inline-block" is the baseline of its last line box
    // in the normal flow, unless it has no in-flow line boxes.
    //   https://www.w3.org/TR/CSS21/visudet.html#line-height
    if (this.line_box_.LineExists()) {
      ++this.line_count_;

      this.preferred_min_width_ =
        LayoutUnit.Max(this.preferred_min_width_, this.line_box_.shrink_to_fit_width());

      // If "height" is "auto", the used value is the distance from box's top
      // content edge to the bottom edge of the last line box, if the box
      // establishes an inline formatting context with one or more lines.
      //   https://www.w3.org/TR/CSS21/visudet.html#normal-block
      this.set_auto_height(this.line_box_.top().ADD(this.line_box_.height()));

      this.set_baseline_offset_from_top_content_edge(
        this.line_box_.top().ADD(this.line_box_.baseline_offset_from_top()));

      if (this.line_box_.IsEllipsisPlaced()) {
        this.ellipses_coordinates_.push(this.line_box_.GetEllipsisCoordinates());
      }
    }

    this.line_box_ = undefined;
  }
};
