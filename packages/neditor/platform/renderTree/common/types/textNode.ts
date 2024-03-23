// import { Optional } from '../../base/common/typescript';
// import { Vector2d } from '../math/vector2d_f';
// import { Background } from './background';
// import { GlyphBuffer } from './glyph_buffer';
// import { ColorRGBA } from './color_rgba';
// import { Shadow } from './shadow';
// import { Node } from './node';
// import { NodeVisitor } from './node_visitor';
// import { baseGetTypeId as _GetTypeId } from '../base/type_id';

import { Vector2d } from '../../../../base/common/geometry/vector2d';
import { Optional } from '../../../../base/common/typescript';
import { Background } from '../components/background';
import { ColorRGBA } from '../components/colorRgba';
import { GlyphBuffer } from '../components/glyphBuffer';
import { Shadow } from '../components/shadow';
import { NodeVisitor } from '../nodeVisitor';
import { RenderTreeNode } from './baseNode';

export class TextNodeBuilder {
  offset: Vector2d;

  // All of the glyph data needed to render the text.
  glyph_buffer: GlyphBuffer;

  // The foreground color of the text.
  color: ColorRGBA;

  // Shadows to be applied under the text.  These will be drawn in
  // back-to-front order, so the last shadow will be on the bottom.
  shadows: Shadow[] = [];

  // The background color of the text.
  background: Background | undefined;

  constructor(
    offset: Vector2d,
    glyph_buffer: GlyphBuffer,
    color: ColorRGBA,
    background?: Optional<Background>
  ) {
    this.offset = offset;
    this.glyph_buffer = glyph_buffer;
    this.color = color;
    this.background = background;
  }
}

// A single line of text or a directional run as specified by Unicode
// Bidirectional Algorithm (http://www.unicode.org/reports/tr9/).
// When rendering the text node, the origin will horizontally be on the far left
// of the text, and vertically it will be on the text's baseline.  This means
// that the text bounding box may cover area above and below the TextNode's
// origin.
export class TextNode extends RenderTreeNode {
  data_: TextNodeBuilder;
  static ID = 1;
  id = TextNode.ID++;

  constructor(builder: TextNodeBuilder)
  constructor(offset: Vector2d,
              glyph_buffer: GlyphBuffer,
              color: ColorRGBA)
  constructor(offset: Vector2d | TextNodeBuilder,
              glyph_buffer?: GlyphBuffer,
              color?: ColorRGBA) {
    super();
    if (offset instanceof TextNodeBuilder) {
      this.data_ = offset;
    } else {
      this.data_ = new TextNodeBuilder(offset, glyph_buffer!, color!);
    }
  }

  accept(visitor: NodeVisitor) {
    visitor.VisitTextNode(this);
  }
  getBounds() {
    let bounds = this.data_.glyph_buffer.GetBounds();
    if (this.data_.shadows) {
      for (let i = 0; i < this.data_.shadows.length; ++i) {
        bounds.union(
          (this.data_.shadows)[i].ToShadowBounds(this.data_.glyph_buffer.GetBounds()));
      }
    }
    bounds.offset(this.data_.offset);
    return bounds;
  }

  data() {
    return this.data_;
  }
}
