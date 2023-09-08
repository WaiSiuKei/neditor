import { Optional } from '../../base/common/typescript';
import { Vector2d } from '../../base/graphics/types';
import { Vector2dF } from '../math/vector2d_f';
import { Background } from './background';
import { GlyphBuffer } from './glyph_buffer';
import { ColorRGBA } from './color_rgba';
import { Shadow } from './shadow';
import { Node } from './node';
import { NodeVisitor } from './node_visitor';
import { baseGetTypeId as _GetTypeId } from '../base/type_id';

export class TextNodeBuilder {
  offset: Vector2dF;

  // All of the glyph data needed to render the text.
  glyph_buffer: GlyphBuffer;
  glyphs: Optional<Array<GlyphInfo>>;
  // The foreground color of the text.
  color: ColorRGBA;

  // Shadows to be applied under the text.  These will be drawn in
  // back-to-front order, so the last shadow will be on the bottom.
  shadows: Shadow[] = [];

  // The background color of the text.
  background: Background | undefined;

  constructor(
    offset: Vector2dF,
    glyph_buffer: GlyphBuffer,
    color: ColorRGBA,
    background?: Optional<Background>,
    glyphs?: Optional<GlyphInfo[]>,
  ) {
    this.offset = offset;
    this.glyph_buffer = glyph_buffer;
    this.color = color;
    this.background = background;
    this.glyphs = glyphs;
  }
}

export interface GlyphInfo {
  buffer: GlyphBuffer,
  transposeX: number,
  transposeY: number
  i: number,
  rotation: number,
  p0: Vector2d,
  p1: Vector2d,
}

// A single line of text or a directional run as specified by Unicode
// Bidirectional Algorithm (http://www.unicode.org/reports/tr9/).
// When rendering the text node, the origin will horizontally be on the far left
// of the text, and vertically it will be on the text's baseline.  This means
// that the text bounding box may cover area above and below the TextNode's
// origin.
export class TextNode extends Node {
  data_: TextNodeBuilder;
  static ID = 1;
  id = TextNode.ID++;

  constructor(builder: TextNodeBuilder)
  constructor(offset: Vector2dF, glyph_buffer: GlyphBuffer, color: ColorRGBA)
  constructor(offset: Vector2dF | TextNodeBuilder, glyph_buffer?: GlyphBuffer, color?: ColorRGBA) {
    super();
    if (offset instanceof TextNodeBuilder) {
      this.data_ = offset;
    } else {
      this.data_ = new TextNodeBuilder(offset, glyph_buffer!, color!);
    }
  }

  dispose() {
    super.dispose();
    this.data_.glyph_buffer.dispose();
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitTextNode(this);
  }
  GetBounds() {
    let bounds = this.data_.glyph_buffer.GetBounds();
    if (this.data_.shadows) {
      for (let i = 0; i < this.data_.shadows.length; ++i) {
        bounds.Union(
          (this.data_.shadows)[i].ToShadowBounds(this.data_.glyph_buffer.GetBounds()));
      }
    }
    bounds.Offset(this.data_.offset);
    return bounds;
  }

  GetTypeId(): number {
    return _GetTypeId(TextNode);
  }
  data() {
    return this.data_;
  }
}
