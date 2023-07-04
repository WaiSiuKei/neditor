// The FontProvider class is an abstract base class representing a collection of
// fonts with a matching style and size, which provides fonts for any given
// character based upon what it considers to be the best match.
import type { Font, FontStyle } from './font';
import { GlyphIndex } from './glyph';

export abstract class FontProvider {
  // The style of the fonts contained within the collection.
  abstract style(): FontStyle

  // The size of the fonts contained within the collection.
  abstract size(): number

  // Returns the font-glyph combination that the FontProvider considers to be
  // the best match for the passed in character. The returned font is guaranteed
  // to be non-NULL. However, the glyph index may be set to |kInvalidGlyphIndex|
  // if the returned font does not provide a glyph for the character.
  abstract GetCharacterFont(utf32_character: number): { font: Font, glyph_index: GlyphIndex }
}


