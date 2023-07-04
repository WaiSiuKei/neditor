// Describes a render_tree::Typeface using Skia objects such as Typeface.
// NOTE: Character glyph queries are not thread-safe and should only occur from
// a single thread. However, the typeface can be created on a different thread
// than the thread making the character glyph queries.
import { Typeface as BaseTypeFace, TypefaceId } from '../../render_tree/typeface';
import { Typeface as SkTypeface } from 'canvaskit-wasm';
import { Font } from './sk_font';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { IDisposable } from '../../../base/common/lifecycle';

export class Typeface extends BaseTypeFace {
  constructor(
    private typeface_: SkTypeface,
  ) {
    super();
  }

  CreateFontWithSize(font_size: number): Font {
    return new Font(this, font_size);
  }
  GetGlyphForCharacter(utf32_character: number): number {
    let ids = this.typeface_.getGlyphIDs(String.fromCodePoint(utf32_character));
    return ids[0];
    // If the character falls within the first 256 characters (Latin-1), then
    // simply check the primary page for the glyph.
    // if (utf32_character < kPrimaryPageSize) {
    //   // The first page glyph array is lazily allocated, so we don't use the
    //   // memory if it's never requested.
    //   if (!primary_page_character_glyphs_) {
    //     primary_page_character_glyphs_.reset(
    //       new render_tree::GlyphIndex[kPrimaryPageSize]);
    //     memset(&primary_page_character_glyphs_[0], 0xff,
    //     kPrimaryPageSize * sizeof(render_tree::GlyphIndex));
    //     // If it has already been allocated, then check the array for the
    //     // character. The unknown glyph signifies that the character's glyph has
    //     // not already been retrieved.
    //   } else if (primary_page_character_glyphs_[utf32_character] !=
    //     render_tree::kUnknownGlyphIndex) {
    //     return primary_page_character_glyphs_[utf32_character];
    //   }
    // }
    // render_tree::GlyphIndex glyph = render_tree::kInvalidGlyphIndex;
    // typeface_->unicharsToGlyphs(&utf32_character, 1, &glyph);
    //
    // // Both cache and return the character's glyph.
    // if (utf32_character < kPrimaryPageSize) {
    //   return primary_page_character_glyphs_[utf32_character] = glyph;
    // }
    // return glyph;
  }

  GetSkTypeface() {
    return this.typeface_;
  }

  // From render_tree::Typeface

  // Returns the typeface's id, which is guaranteed to be unique among the
  // typefaces registered with the resource provider.
  GetId(): TypefaceId {
    return 255;
  }

  // Returns a size estimate for this typeface in bytes.
  GetEstimatedSizeInBytes(): number {
    NOTIMPLEMENTED();
  }

  // Creates a font using this typeface, with the font's size set to the passed
  // in value.
  // scoped_refptr<render_tree::Font> CreateFontWithSize(float font_size) override;

  // Returns an index to the glyph that the typeface provides for a given UTF-32
  // unicode character. If the character is unsupported, then it returns
  // kInvalidGlyphIndex. The results are cached to speed up subsequent requests
  // for the same character.
  // render_tree::GlyphIndex GetGlyphForCharacter(int32 utf32_character) override;

  // Usually covers Latin-1 in a single page.
  static kPrimaryPageSize = 256;

  // The underlying Typeface that was used to create this typeface.
  // private typeface_: SkTypeface;

  // The glyphs for characters are lazily computed and cached to speed up later
  // lookups. The page containing indices 0-255 is optimized within an array.
  // Thread checking is used to used to ensure that they are only accessed and
  // modified on a single thread.
  // std::unique_ptr<render_tree::GlyphIndex[]> primary_page_character_glyphs_;
};
