// Describes a render_tree::Font using Skia font description objects such as
// SkTypeface.
// NOTE: Glyph queries are not thread-safe and should only occur from a single
// thread. However, the font can be created on a different thread than the
// thread making the glyph queries.
import { Font as BaseFont, FontMetrics } from '../../render_tree/font';
import type { Typeface } from './sk_typeface';
import { SkScalar } from './skia/sk_scalar';
import { RectF } from '../../math/rect_f';
import { SkFont } from './skia/sk_font';
import { SkRect } from './skia/sk_rect';
import { CanvasKit } from '@neditor/skia';
import { Optional } from "../../../base/common/typescript";

const kXHeightEstimateFactor = 0.56;

export class Font extends BaseFont {
  constructor(
    // The Typeface that was used to create this font.
    private typeface_: Typeface,
    // Size of the text in pixels.
    private size_: SkScalar,
  ) {
    super();
  }

  GetTypefaceId(): number {
    return this.typeface_.GetId();
  }
  GetFontMetrics(): FontMetrics {
    const font = this.GetSkFont()
    // SkFontMetrics font_metrics;
    // font.getMetrics(&font_metrics);
    let font_metrics = font.getMetrics();

    // The x-height is the height of the 'x' glyph. It is used to find the visual
    // 'middle' of the font to allow vertical alignment to the middle of the font.
    // See also https://en.wikipedia.org/wiki/X-height
    let x_height;
    // if (font_metrics.fXHeight) {
    //   x_height = font_metrics.fXHeight;
    // } else {
    // If the font does not have an 'x' glyph, we need to estimate the value.
    // A good estimation  is to use 0.56 * the font ascent.
    x_height = font_metrics.ascent * kXHeightEstimateFactor;
    // }

    // In Skia, ascent is negative, while descent and leading are positive.
    return new FontMetrics(-font_metrics.ascent, font_metrics.descent,
      font_metrics.leading, x_height);
  }
  GetGlyphForCharacter(utf32_character: number): number {
    return this.typeface_.GetGlyphForCharacter(utf32_character);
  }
  GetGlyphBounds(glyph: number): RectF {
// Check to see if the glyph falls within the the first 256 glyphs. These
    // characters are part of the primary page and are stored within an array as
    // an optimization.
    // if (glyph < Typeface.kPrimaryPageSize) {
    //   // The first page is lazily allocated, so we don't use the memory if it's
    //   // never used.
    //   if (!this.primary_page_glyph_bounds_) {
    //     primary_page_glyph_bounds_.reset(new math::RectF[kPrimaryPageSize]);
    //     // If the page has already been allocated, then check for the glyph's
    //     // bounds having already been set. If this is the case, simply return the
    //     // bounds.
    //   } else if (primary_page_glyph_bounds_bits_[glyph]) {
    //     return primary_page_glyph_bounds_[glyph];
    //   }
    //   // Otherwise, check for the glyph's bounds within the map.
    // } else {
    //   GlyphToBoundsMap::iterator map_iterator = glyph_to_bounds_map_.find(glyph);
    //   if (map_iterator != glyph_to_bounds_map_.end()) {
    //     return map_iterator->second;
    //   }
    // }
    const font = this.GetSkFont()
    // If we reach this point, the glyph's bounds were not previously cached and
    // need to be calculated them now.

    // left, top, right, bottom
    let skia_bounds: SkRect = font.getGlyphBounds([glyph], null);

    let left = skia_bounds[0];
    let top = skia_bounds[1];
    let right = skia_bounds[2];
    let bottom = skia_bounds[3];
    let width = right - left;
    let height = bottom - top;

    return new RectF(0, -top, width, height);

    // // Both cache and return the glyph's bounds.
    // if (glyph < Typeface. kPrimaryPageSize) {
    //   let rect = new RectF(0, top, width, height)
    //   this.primary_page_glyph_bounds_.set(glyph, rect)
    //   return rect
    // } else {
    //
    //   return glyph_to_bounds_map_[glyph] =
    //     math::RectF(0, skia_bounds.top(), width, skia_bounds.height());
    // }
  }
  GetGlyphWidth(glyph: number): number {
    const font = this.GetSkFont()
    let widths = font.getGlyphWidths([glyph], null);

    return widths[0]
  }
  // Font(Typeface* typeface, SkScalar size);
  //
  // const sk_sp<SkTypeface_Cobalt>& GetSkTypeface() const;
  //
  // // Returns the pixel size described by this font.
  // SkScalar size() const { return size_; }
  //
  // // Returns the font's typeface id, which is guaranteed to be unique among the
  // // typefaces registered with the font's resource provider.
  // render_tree::TypefaceId GetTypefaceId() const override;
  //
  // // Invokes Skia to determine the font metrics common for all glyphs in the
  // // font.
  // render_tree::FontMetrics GetFontMetrics() const override;
  //
  // // Invokes Skia to retrieve the index of the glyph that the typeface provides
  // // for the given UTF-32 unicode character.
  // render_tree::GlyphIndex GetGlyphForCharacter(int32 utf32_character) override;
  //
  // // Invokes Skia to determine the bounds of the given glyph if it were to be
  // // rendered using this particular font. The results are cached to speed up
  // // subsequent requests for the same glyph.
  // const math::RectF& GetGlyphBounds(render_tree::GlyphIndex glyph) override;
  //
  // // Invokes Skia to determine the width of the given glyph if it were to be
  // // rendered using this particular font. The results are cached to speed up
  // // subsequent requests for the same glyph.
  // float GetGlyphWidth(render_tree::GlyphIndex glyph) override;

  // Returns a SkFont setup for rendering text with this font.  Clients
  // are free to customize the SkFont further after obtaining it, if they
  // wish.
  private sk_font_: Optional<SkFont>;
  GetSkFont() {
    if (!this.sk_font_) {
      const font = new CanvasKit.Font(this.typeface_.GetSkTypeface(), this.size_)
      font.setSubpixel(true);
      font.setLinearMetrics(true);
      //  font.setHinting(SkFontHinting::kSlight);
      this.sk_font_ = font;
    }
    return this.sk_font_;
  }

  // // Returns a static SkFont with the default flags enabled.
  // static const SkFont& GetDefaultSkFont();
  //
  // // Returns a static SkPaint with the default flags enabled.
  // static const SkPaint& GetDefaultSkPaint();

  // private:
  //  // Usually covers Latin-1 in a single page.
  static kPrimaryPageSize = 256;
  //

  //  // The bounds for glyphs are lazily computed and cached to speed up later
  //  // lookups. The page containing indices 0-255 is optimized within an array.
  //  // Thread checking is used to used to ensure that they are only accessed and
  //  // modified on a single thread.
  //  std::bitset<kPrimaryPageSize> primary_page_glyph_bounds_bits_;
  //  std::unique_ptr<math::RectF[]> primary_page_glyph_bounds_ [ ]
  // private primary_page_glyph_bounds_: GlyphToBoundsMap = new Map<GlyphIndex, RectF>();
  // private glyph_to_bounds_map_: GlyphToBoundsMap = new Map<GlyphIndex, RectF>();
};
