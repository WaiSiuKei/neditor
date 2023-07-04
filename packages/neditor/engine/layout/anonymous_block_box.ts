// A block-level block container box that establish an inline formatting
// context. Anonymous block boxes are created to enclose inline-level
// children in a block formatting context.
//   https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level
import { BlockContainerBox } from './block_container_box';
import { BaseDirection } from './base_direction';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { GetUsedColor, GetUsedLength, UsedStyleProvider } from './used_style';
import { Box, LayoutParams, Level, MarginCollapsingStatus } from './box';
import { Vector2dF } from '../math/vector2d_f';
import { FontList } from '../dom/font_list';
import { ContainerBox } from './container_box';
import { CompositionNodeBuilder } from '../render_tree/composition_node';
import { KeywordValue } from '../cssom/keyword_value';
import { TextNode } from '../render_tree/text_node';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { DCHECK } from '@neditor/core/base/check';
import { FormattingContext } from './formatting_context';
import { LayoutUnit } from './layout_unit';
import { InlineFormattingContext } from './inline_formatting_context';
import { allocStr, StringPiece, UnicodeString } from '@neditor/icu';

type  EllipsesCoordinates = Vector2dF[]

export class AnonymousBlockBox extends BlockContainerBox {
  private AreEllipsesEnabled(): boolean {
    return this.parent()!.computed_style()!.overflow ==
      KeywordValue.GetHidden() &&
      this.parent()!.computed_style()!.text_overflow ==
      KeywordValue.GetEllipsis();
  }

  // A font used for text width and line height calculations.
  private used_font_: FontList;

  // The XY coordinates of all ellipses placed while laying out the anonymous
  // block box within an inline formatting context.
  ellipses_coordinates_: EllipsesCoordinates = [];
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    base_direction: BaseDirection,
    used_style_provider: UsedStyleProvider,
    // LayoutStatTracker* layout_stat_tracker
  ) {
    super(css_computed_style_declaration, base_direction, used_style_provider);
    this.used_font_ = used_style_provider.GetUsedFontList(
      css_computed_style_declaration.data()!.font_family,
      css_computed_style_declaration.data()!.font_size,
      css_computed_style_declaration.data()!.font_style,
      css_computed_style_declaration.data()!.font_weight);
    {
    }
  }

  // From |Box|.
  GetLevel() {
    return Level.kBlockLevel;
  }
  GetMarginCollapsingStatus(): MarginCollapsingStatus {
    // If all enclosed boxes are absolutely-positioned, ignore it for
    // margin-collapse.

    if (this.child_boxes().every(box => box.IsAbsolutelyPositioned())) return MarginCollapsingStatus.kIgnore;

    // If any enclosed block is inline-level, break collapsing model for
    // parent/siblings.
    return MarginCollapsingStatus.kSeparateAdjoiningMargins;
  }
  AsAnonymousBlockBox() {
    return this;
  }

  SplitBidiLevelRuns() {
    super.SplitBidiLevelRuns();

    for (let i = 0; i < this.child_boxes().length;) {
      let child_box = this.child_boxes()[i];
      if (child_box.TrySplitAtSecondBidiLevelRun()) {
        i = this.InsertSplitSiblingOfDirectChild(i);
      } else {
        ++i;
      }
    }
  }

  HasTrailingLineBreak(): boolean {
    return this.child_boxes().length > 0 && this.child_boxes()[this.child_boxes().length - 1].HasTrailingLineBreak();

  }

  RenderAndAnimateContent(
    border_node_builder: CompositionNodeBuilder,
    stacking_context: ContainerBox) {
    ContainerBox.prototype.RenderAndAnimateContent.call(this, border_node_builder, stacking_context);

    if (this.computed_style()!.visibility != KeywordValue.GetVisible()) {
      return;
    }

    // Only add the ellipses to the render tree if the font is visible. The font
    // is treated as transparent if a font is currently being downloaded and
    // hasn't timed out: "In cases where textual content is loaded before
    // downloadable fonts are available, user agents may... render text
    // transparently with fallback fonts to avoid a flash of text using a fallback
    // font. In cases where the font download fails user agents must display text,
    // simply leaving transparent text is considered non-conformant behavior."
    //   https://www.w3.org/TR/css3-fonts/#font-face-loading
    if (this.ellipses_coordinates_.length && this.used_font_.IsVisible()) {
      let used_color = GetUsedColor(this.computed_style()!.color);

      // Only render the ellipses if the color is not completely transparent.
      if (used_color.a() > 0.0) {
        let ellipsis_value = this.used_font_.GetEllipsisValue();
        const {
          object: { ptr: inputPtr, view: inputView },
          dispose
        } = allocStr(String.fromCodePoint(ellipsis_value), true);
        const stringPiece = new StringPiece(inputPtr, inputView.length);
        const str = UnicodeString.fromUTF8(stringPiece);
        let glyph_buffer = this.used_font_.CreateGlyphBuffer(str, 0, 1, false);
        stringPiece.delete();
        str.delete();

        for (let ellipsis_coordinates of this.ellipses_coordinates_) {
          // const math::Vector2dF& ellipsis_coordinates = *iterator;

          // The render tree API considers text coordinates to be a position of
          // a baseline, offset the text node accordingly.
          border_node_builder.AddChild(new TextNode(ellipsis_coordinates, glyph_buffer, used_color));
        }
        dispose();
      }
    }
  }

  // From |ContainerBox|.

  // This method should never be called, instead all children have to be added
  // through |AddInlineLevelChild|.
  TryAddChild(child_box: Box) {
    NOTREACHED();
    return false;
  }

  // Rest of the public methods.

  // An anonymous block box may only contain inline-level children.
  AddInlineLevelChild(child_box: Box) {
    DCHECK(child_box.GetLevel() == Level.kInlineLevel ||
      child_box.IsAbsolutelyPositioned());
    this.PushBackDirectChild(child_box);
  }

  // From |BlockContainerBox|.
  UpdateRectOfInFlowChildBoxes(
    child_layout_params: LayoutParams): FormattingContext {
    // Do any processing needed prior to ellipsis placement on all of the
    // children.
    for (let box of this.child_boxes()) {
      box.DoPreEllipsisPlacementProcessing();
    }

    // If ellipses are enabled then retrieve the ellipsis width for the font;
    // otherwise, set the width to 0, which indicates that ellipses are not being
    // used.
    let ellipsis_width =
      this.AreEllipsesEnabled() ? this.used_font_.GetEllipsisWidth() : 0;

    // Lay out child boxes in the normal flow.
    //   https://www.w3.org/TR/CSS21/visuren.html#normal-flow
    let inline_formatting_context =
      new InlineFormattingContext(
        this.computed_style()!.line_height,
        this.used_font_.GetFontMetrics(),
        child_layout_params,
        this.base_direction(),
        this.computed_style()!.text_align,
        this.computed_style()!.font_size,
        GetUsedLength(this.computed_style()!.text_indent),
        new LayoutUnit(ellipsis_width)
      );

    let child_box_iterator = 0;
    while (child_box_iterator !== this.child_boxes().length) {
      let child_box = this.child_boxes()[child_box_iterator];
      // Attempt to add the child box to the inline formatting context.
      let child_box_before_wrap = inline_formatting_context.TryAddChildAndMaybeWrap(child_box);
      // If |child_box_before_wrap| is non-NULL, then trying to add the child
      // box caused a line wrap to occur, and |child_box_before_wrap| is set to
      // the last box that was successfully placed on the line. This can
      // potentially be any of the child boxes previously added. Any boxes
      // following the returned box, including ones that were previously
      // added, still need to be added to the inline formatting context.
      if (child_box_before_wrap) {
        // Iterate backwards until the last box added to the line is found, and
        // then increment the iterator, so that it is pointing at the location
        // of the first box to add the next time through the loop.
        while (child_box != child_box_before_wrap) {
          --child_box_iterator;
        }

        // If |child_box_before_wrap| has a split sibling, then this potentially
        // means that a split occurred during the wrap, and a new box needs to
        // be added to the container (this will also need to be the first box
        // added to the inline formatting context).
        //
        // If the split sibling is from a previous split, then it would have
        // already been added to the line and |child_box_iterator| should
        // be currently pointing at it. If this is not the case, then we know
        // that this is a new box produced during the wrap, and it must be
        // added to the container. This will be the first box added during
        // the next iteration of the loop.
        let split_child_after_wrap = child_box_before_wrap.GetSplitSibling();
        let next_child_box_iterator = child_box_iterator + 1;
        if (split_child_after_wrap &&
          (next_child_box_iterator == this.child_boxes().length - 1 ||
            this.child_boxes()[next_child_box_iterator] != split_child_after_wrap)) {
          child_box_iterator =
            this.InsertSplitSiblingOfDirectChild(child_box_iterator);
          continue;
        }
      }

      ++child_box_iterator;
    }
    inline_formatting_context.EndUpdates();
    this.ellipses_coordinates_ = inline_formatting_context.GetEllipsesCoordinates();

    // Do any processing needed following ellipsis placement on all of the
    // children.
    for (let box of this.child_boxes()) {
      box.DoPostEllipsisPlacementProcessing();
    }

    return inline_formatting_context;
  }

  DumpClassName(stream: string): string {
    stream += 'AnonymousBlockBox ';
    return stream;
  }
}
