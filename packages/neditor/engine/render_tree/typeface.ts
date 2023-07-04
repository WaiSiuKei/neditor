import { GlyphIndex } from './glyph';
import type { Font } from './font';

export type  TypefaceId = number

// The Typeface class is an abstract base class representing an implementation
// specific typeface object. While it has no associated size, it supports the
// creation of concrete Font objects at any requested size. The specific glyph
// that the typeface provides for each UTF-32 character is queryable.
// NOTE: Typeface objects are not immutable and offer no thread safety
// guarantees. While Typeface is intended to assist in the creation of
// GlyphBuffer objects, only GlyphBuffer objects, which are immutable and
// thread-safe, should be accessed on multiple threads.
export abstract class Typeface {
  // Returns the typeface's id, which is guaranteed to be unique among the
  // typefaces registered with the resource provider.
  abstract GetId(): TypefaceId

  // Returns a size estimate for this typeface in bytes. While the derived class
  // can potentially return an exact value, there is no guarantee that this will
  // be the case.
  abstract GetEstimatedSizeInBytes(): number

  // Returns a newly created font using this typeface, with the font size set to
  // the passed in value.
  abstract CreateFontWithSize(font_size: number): Font;

  // Returns an index to the glyph that the typeface provides for a given UTF-32
  // unicode character. If the character is unsupported, then it returns
  // kInvalidGlyphIndex.
  abstract GetGlyphForCharacter(utf32_character: number): GlyphIndex
}

