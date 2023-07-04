// Contains metrics common to all glyphs in the font.
import { TypefaceId } from './typeface';
import { GlyphIndex } from './glyph';
import { RectF } from '../math/rect_f';
import { Disposable } from "../../base/common/lifecycle";

export class FontMetrics {
  // The recommended distance above the baseline.
  ascent_: number;
  // The recommended distance below the baseline.
  descent_: number;
  // The recommended distance to ADD_ASSIGN between lines of text.
  leading_: number;
  // The x-height, aka the height of the 'x' glyph, used for centering.
  // See also https://en.wikipedia.org/wiki/X-height
  x_height_: number;
  constructor(ascent: number = 0, descent: number = 0, leading: number = 0, x_height: number = 0) {
    this.ascent_ = ascent;
    this.descent_ = descent;
    this.leading_ = leading;
    this.x_height_ = x_height;
  }

  ascent() {return this.ascent_;}
  descent() {return this.descent_;}
  leading() {return this.leading_;}
  x_height() {return this.x_height_;}

  em_box_height(): number { return this.ascent_ + this.descent_ + this.leading_; }
  baseline_offset_from_top(): number { return this.ascent_ + this.leading_ / 2; }
}

export enum Weight {
  kThinWeight = 100,
  kExtraLightWeight = 200,
  kLightWeight = 300,
  kNormalWeight = 400,
  kMediumWeight = 500,
  kSemiBoldWeight = 600,
  kBoldWeight = 700,
  kExtraBoldWeight = 800,
  kBlackWeight = 900
}

export enum Slant {
  kUprightSlant,
  kItalicSlant,
}

// Used as a parameter to GetLocalTypeface() and GetCharacterFallbackTypeface()
// to describe the font style the caller is seeking.
export class FontStyle {
  weight: Weight;
  slant: Slant;
  constructor(font_weight = Weight.kNormalWeight, font_slant = Slant.kUprightSlant) {
    this.weight = font_weight;
    this.slant = font_slant;
  }
}

// The Font class is an abstract base class representing a typeface with a
// specific size. It provides the font metrics common to all glyphs in the
// font, and supports retrieval of both the glyph that it uses for each UTF-32
// character and the bounds and width information for any of its contained
// glyphs. Since Font objects may be created in the front-end, but must be
// accessed by the rasterizer during GlyphBuffer creation, it is expected that
// they will be downcast again to a rasterizer-specific type through
// base::polymorphic_downcast().
// NOTE: Font objects are not immutable and offer no thread safety guarantees.
// While Font is intended to assist in the creation of GlyphBuffer objects, only
// GlyphBuffer objects, which are immutable and thread-safe, should be accessed
// on multiple threads.
export abstract class Font {
// Returns the font's typeface id, which is guaranteed to be unique among the
  // typefaces registered with the font's resource provider.
  abstract GetTypefaceId(): TypefaceId

  // Returns the metrics common to all glyphs in the font. Used to calculate
  // the recommended line height and spacing between the lines.
  abstract GetFontMetrics(): FontMetrics

  // Returns an index to the glyph that the font provides for a given UTF-32
  // unicode character. If the character is unsupported, then it returns
  // kInvalidGlyphIndex.
  abstract GetGlyphForCharacter(utf32_character: number): GlyphIndex

  // Returns the bounding box for a given glyph. While left is always zero,
  // note that since the glyph is output with the origin vertically on the
  // baseline, the top of the bounding box will likely be non-zero and is used
  // to indicate the offset of the glyph bounding box from the origin.  The
  // return value is given in units of pixels.
  abstract GetGlyphBounds(glyph: GlyphIndex): RectF

  // Returns the width of a given glyph. The return value is given in units of
  // pixels.
  abstract GetGlyphWidth(glyph: GlyphIndex): number
}
