// Describes a render_tree::GlyphBuffer using Skia. This object contain all of
// the information needed by Skia to render glyphs and is both immutable and
// thread-safe.
import { GlyphBuffer as BaseGlyphBuffer } from '../../render_tree/glyph_buffer';
import { TextBlob } from 'canvaskit-wasm';
import { RectF } from '../../math/rect_f';
import { Optional } from '@neditor/core/base/common/typescript';
import { IDisposable } from "../../../base/common/lifecycle";
import { isNil } from "../../../base/common/type";

// text_blob 是 optional，因为不可见字符不需要渲染
export class GlyphBuffer extends BaseGlyphBuffer {
  constructor(
    bounds: RectF,
    private chars_: string,
    text_blob: Optional<TextBlob>,
  ) {
    super(bounds);
    this.text_blob_ = text_blob;
  }

  GetTextBlob() {
    return this.text_blob_;
  }
  dispose() {
    // FIXME:text_blob 是引用，不能 delete
    // if (this.text_blob_) {
    //   this.text_blob_.deleteLater();
    // }
  }

  private text_blob_: Optional<TextBlob>;
};
