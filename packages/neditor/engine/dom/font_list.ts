import { Font, FontMetrics, FontStyle } from '../render_tree/font';
import { FontProvider } from '../render_tree/font_provider';
import { Typeface, TypefaceId } from '../render_tree/typeface';
import type { FontCache } from './font_cache';
import { GlyphBuffer } from '../render_tree/glyph_buffer';
import { GlyphIndex, kInvalidGlyphIndex } from '../render_tree/glyph';
import { DCHECK } from '@neditor/core/base/check';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { kSpaceCharacter } from '../base/unicode/character_values';
import { UnicodeString } from '@neditor/icu';
import { Ptr } from '@neditor/core/base/common/typescript';
import { Entry, UnicodeRange } from './font_face';
import { kDefaultFont } from '../renderer/rasterizer/sk_resource_provider';
import { IDisposable } from "../../base/common/lifecycle";
import { NOTREACHED } from '../../base/common/notreached';

export enum State {
  kUnrequestedState,
  kLoadingWithTimerActiveState,
  kLoadingWithTimerExpiredState,
  kLoadedState,
  kUnavailableState,
  kDuplicateState,
};

// A font-face for a font-family. It has an internal state, which lets the font
// list know whether or not the font has already been requested, and if so,
// whether or not it was available. |font_| will only be non-NULL in the case
// where |state_| is set to |kLoadedState|.
export class FontFace {

  state = State.kUnrequestedState;
  entry: Ptr<Entry>;

  // The render_tree::Font obtained via the font cache using |family_name_| in
  // font list font, along with |style_| and |size_| from the containing font
  // list, and the unicode range needed for the requested character. It is only
  // non-NULL in the case where |state_| is set to |kLoadedState|.
  font: Ptr<Font>;
}

// A specific font family within a font list. It has an internal state, which
// lets the font list know whether or not the font has already been requested,
// and if so, whether or not it was available. |font_| and |character_map_|
// will only be non-NULL in the case where |state_| is set to |kLoadedState|.
export class FontListFont {
  family_name: string;
  // The render_tree::Font obtained via the font cache using |family_name_| in
  // font list font, along with |style_| and |size_| from the containing font
  // list. It is only non-NULL in the case where |state_| is set to
  // |kLoadedState|.
  faces: FontFace[] = [];
  constructor(family_name: string) {
    this.family_name = family_name;
  }
}

// The key used for maps with a |FontList| value. It is also used for
// initializing the member variables of a |FontList| object.
export class FontListKey {
  family_names: string[] = [];
  style: FontStyle = new FontStyle();
  size: number;
  constructor() {
    this.size = 0;
  }

  LT(rhs: FontListKey): boolean {
    if (this.size < rhs.size) {
      return true;
    } else if (rhs.size < this.size) {
      return false;
    } else if (this.style.weight! < rhs.style.weight!) {
      return true;
    } else if (rhs.style.weight! < this.style.weight!) {
      return false;
    } else if (this.style.slant! < rhs.style.slant!) {
      return true;
    } else if (rhs.style.slant! < this.style.slant!) {
      return false;
    } else {
      return this.family_names.length < rhs.family_names.length!;
    }
  }
}

// |FontList| represents a unique font-style, font-weight, font-size, and
// font-family property combination within a document and is shared by all
// layout objects with matching font properties. It tracks a list of fonts,
// which it lazily requests from the font cache as required. It uses these to
// determine the font metrics for the font properties, as well as the specific
// fonts that should be used to render passed in text.
type FallbackTypefaceToFontMap = Map<TypefaceId, Font>
type CharacterFallbackTypefaceMap = Map<number, Typeface>
type FontListFonts = FontListFont[]

const kHorizontalEllipsisValue = 0x2026;

export class FontList extends FontProvider implements IDisposable {

  // This is a mapping of a unique fallback typeface id to a specific fallback
  // font. By keeping this separate from the character fallback map, font lists
  // with different sizes but the same style can share the same character
  // fallback map.
  fallback_typeface_to_font_map_: FallbackTypefaceToFontMap = new Map<TypefaceId, Font>();

  // The font cache, which provides both font family fonts and character
  // fallback fonts to the font list.
  font_cache_: FontCache;

  fonts_: FontListFonts = [];
  style_: FontStyle;
  size_: number;

  // The first loaded font in the font list. Lazily generated the first time it
  // is requested. Used with font metrics and for generating the size of the
  // space character.
  primary_font_?: Font;

  // Font metrics are lazily generated the first time they are requested.
  is_font_metrics_set_: boolean;
  font_metrics_: FontMetrics;

  // Space width is lazily generated the first time it is requested.
  is_space_width_set_: boolean;
  space_width_: number;

  // The ellipsis info is lazily generated the first time it is requested.
  is_ellipsis_info_set_: boolean;
  ellipsis_font_?: Font;
  ellipsis_width_: number;

  // A mapping of the typeface to use with each fallback character. The font
  // list holds a reference to the map, which is owned by the font cache, and
  // shared between all font lists with a matching font style. If the font list
  // encounters a character that is not in the map, it populates the map with
  // the character itself, rather than relying on the cache to populate it.
  character_fallback_typeface_map_: CharacterFallbackTypefaceMap;

  constructor(font_cache: FontCache, font_list_key: FontListKey) {
    super();
    this.font_cache_ = font_cache;
    this.style_ = font_list_key.style!;
    this.size_ = font_list_key.size;
    this.is_font_metrics_set_ = false;
    this.font_metrics_ = new FontMetrics(0, 0, 0, 0);
    this.is_space_width_set_ = false;
    this.space_width_ = 0;
    this.is_ellipsis_info_set_ = false;
    this.ellipsis_width_ = 0;
    this.character_fallback_typeface_map_ = this.font_cache_.GetCharacterFallbackTypefaceMap(this.style_);

    // Add all of the family names to the font list fonts.
    for (let i = 0; i < font_list_key.family_names.length; ++i) {
      let font = new FontListFont(font_list_key.family_names[i]);
      font.faces = this.font_cache_.GetFacesForFamilyAndStyle(font.family_name, this.style_);
      this.fonts_.push(font);
    }

    // Add an empty font at the end in order to fall back to the zero typeface.
    const default_font = new FontListFont(kDefaultFont);
    const default_face = new FontFace();
    default_font.faces = [default_face];
    this.fonts_.push(default_font);
  }

  // Resets the font list back to its initial state.
  dispose() {
    for (let i = 0; i < this.fonts_.length; ++i) {
      let font_list_font = this.fonts_[i];
      for (let face of font_list_font.faces) {
        face.state = State.kUnrequestedState;
        face.font = undefined;
      }
    }

    this.primary_font_ = undefined;
    this.is_font_metrics_set_ = false;
    this.is_space_width_set_ = false;
    this.is_ellipsis_info_set_ = false;
    this.ellipsis_font_ = undefined;

    this.fallback_typeface_to_font_map_.clear();
  }

  // Reset loading fonts sets all font list fonts with a state of
  // |kLoadingState| back to |kUnrequestedState|, which will cause them to be
  // re-requested then next time they are needed.
  // If a font is encountered with a state of |kLoadingState| prior to the
  // first loaded font, then the primary font and its associated values are
  // reset, as they may change if the loading font is now available.
  ResetLoadingFonts() {
    let found_loaded_font = false;

    for (let i = 0; i < this.fonts_.length; ++i) {
      let font_list_font = this.fonts_[i];

      for (let face of font_list_font.faces) {
        if (face.state == State.kLoadingWithTimerActiveState ||
          face.state == State.kLoadingWithTimerExpiredState) {
          face.state = State.kUnrequestedState;
          // If a loaded font hasn't been found yet, then the cached values need
          // to be reset. It'll potentially change the primary font.
          if (!found_loaded_font) {
            this.primary_font_ = undefined;
            this.is_font_metrics_set_ = false;
            this.is_space_width_set_ = false;
            this.is_ellipsis_info_set_ = false;
            this.ellipsis_font_ = undefined;
          }
        } else if (face.state == State.kLoadedState) {
          found_loaded_font = true;
        }
      }
    }
  }

  IsVisible(): boolean {
    for (let i = 0; i < this.fonts_.length; ++i) {
      // While any font in the font list is loading with an active timer, the font
      // is made transparent. "In cases where textual content is loaded before
      // downloadable fonts are available, user agents may... render text
      // transparently with fallback fonts to avoid a flash of  text using a
      // fallback font. In cases where the font download fails user agents must
      // display text, simply leaving transparent text is considered
      // non-conformant behavior."
      //   https://www.w3.org/TR/css3-fonts/#font-face-loading
      for (let face of this.fonts_[i].faces) {
        if (face.state == State.kLoadingWithTimerActiveState) {
          return false;
        }
      }
    }

    return true;
  }

  // Given a string of text, returns the glyph buffer needed to render it. In
  // the case where |maybe_bounds| is non-NULL, it will also be populated with
  // the bounds of the rect.
  CreateGlyphBuffer(text: UnicodeString, text_start: number, text_length: number, is_rtl: boolean): GlyphBuffer {
    return this.font_cache_.CreateGlyphBuffer(text, text_start, text_length, is_rtl, this);
  }

  // Given a string of text, return its width. This is faster than
  // CreateGlyphBuffer().
  GetTextWidth(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    is_rtl: boolean,
    maybe_used_fonts?: Font[]
  ): number {
    return this.font_cache_.GetTextWidth(text, text_start, text_length, is_rtl, this,
      maybe_used_fonts);
  }

  GetFontMetrics(): FontMetrics
  // Given a vector of fonts, provides the combined font metrics of all of the
  // fonts (including the primary font, regardless of whether it is present
  // in the vector).
  GetFontMetrics(fonts: Font[]): FontMetrics
  GetFontMetrics(fonts?: Font[]): FontMetrics {
    if (!fonts) {
      // The font metrics are lazily generated. If they haven't been set yet, it's
      // time to set them.
      if (!this.is_font_metrics_set_) {
        this.is_font_metrics_set_ = true;
        this.font_metrics_ = this.GetPrimaryFont().GetFontMetrics();
      }

      return this.font_metrics_;
    }
    // Call GetFontMetrics to ensure that the primary metrics have been
    // generated.
    let primary_typeface_id = this.GetPrimaryFont().GetTypefaceId();
    let primary_metrics = this.GetFontMetrics();

    // Initially set the font metrics values to the primary font metrics. It is
    // included regardless of the the contents of the vector.
    let max_ascent = primary_metrics.ascent();
    let max_descent = primary_metrics.descent();
    let max_leading = primary_metrics.leading();
    let max_x_height = primary_metrics.x_height();

    // Calculate the max metrics values from all of the fonts.
    for (let i = 0; i < fonts.length; ++i) {
      // If this is the primary font, simply skip it. It has already been
      // included.
      if (fonts[i].GetTypefaceId() == primary_typeface_id) {
        continue;
      }

      let current_metrics = fonts[i].GetFontMetrics();
      if (current_metrics.ascent() > max_ascent) {
        max_ascent = current_metrics.ascent();
      }
      if (current_metrics.descent() > max_descent) {
        max_descent = current_metrics.descent();
      }
      if (current_metrics.leading() > max_leading) {
        max_leading = current_metrics.leading();
      }
      if (current_metrics.x_height() > max_x_height) {
        max_x_height = current_metrics.x_height();
      }
    }

    return new FontMetrics(max_ascent, max_descent, max_leading, max_x_height);
  }

  // Returns the text run that signifies an ellipsis code point.
  GetEllipsisValue(): number {
    return kHorizontalEllipsisValue;
  }
  // Returns the first font in the font-list that supports the ellipsis code
  // point. In the case where the ellipsis font has not already been calculated,
  // it lazily generates it.
  GetEllipsisFont(): Font {
    this.GenerateEllipsisInfo();
    return this.ellipsis_font_!;
  }
  // Returns the width of the ellipsis in the ellipsis font. In the case where
  // the width has not already been calculated, it lazily generates it.
  GetEllipsisWidth(): number {
    this.GenerateEllipsisInfo();
    return this.ellipsis_width_;
  }

  // Returns the width of the space in the first font in the font list that
  // supports the space character. In the case where the width has not already
  // been calculated, it lazily generates it.
  GetSpaceWidth(): number {
    this.GenerateSpaceWidth();
    return this.space_width_;
  }

  // From render_tree::FontProvider

  style() {
    return this.style_;
  }
  size() {
    return this.size_;
  }

  // Returns the first font in the font list that supports the specified
  // UTF-32 character or a fallback font provided by the font cache if none of
  // them do.
  // |GetPrimaryFont()| causes |RequestFont()| to be called on each font with a
  // state of |kUnrequestedState| in the list, until a font is encountered with
  // that has the specified character or all fonts in the list have been
  // requested.
  GetCharacterFont(utf32_character: number): { font: Font, glyph_index: GlyphIndex } {
    // Walk the list of fonts, requesting any encountered that are in an
    // unrequested state. The first font encountered that has the character is the
    // character font.
    for (let i = 0; i < this.fonts_.length; ++i) {
      let font_list_font = this.fonts_[i];

      for (let face of font_list_font.faces) {
        const entry = face.entry;
        if (entry && !CharInRange(entry.unicode_range, utf32_character)) {
          continue;
        }
        if (face.state == State.kUnrequestedState) {
          this.RequestFont(font_list_font.family_name, face);
        }

        if (face.state == State.kLoadedState) {
          let glyph_index = face.font!.GetGlyphForCharacter(utf32_character);
          if (glyph_index != kInvalidGlyphIndex) {
            return {
              font: face.font!,
              glyph_index,
            };
          }
        }
      }
    }

    return this.GetFallbackCharacterFont(utf32_character);
  }

  GetFallbackCharacterFont(utf32_character: number): { font: Font, glyph_index: GlyphIndex } {
    let fallback_typeface = this.character_fallback_typeface_map_.get(utf32_character);
    if (!fallback_typeface) {
      fallback_typeface = this.font_cache_.GetCharacterFallbackTypeface(utf32_character, this.style_);
    }

    let glyph_index = fallback_typeface!.GetGlyphForCharacter(utf32_character);

    // Check to see if the typeface id already maps to a specific font. If it does
    // simply return that font.
    let fallback_font = this.fallback_typeface_to_font_map_.get(fallback_typeface!.GetId());
    if (!fallback_font) {
      let font = this.font_cache_.GetFontFromTypefaceAndSize(fallback_typeface, this.size_);
      this.fallback_typeface_to_font_map_.set(fallback_typeface!.GetId(), font);
      fallback_font = font;
    }

    return {
      font: fallback_font!,
      glyph_index,
    };
  }

  // The primary font is the first successfully loaded font among the font list
  // fonts. A loading font will potentially later become the primary font if it
  // successfully loads, but until then, a subsequent font will be used as the
  // primary one.
  // |GetPrimaryFont()| causes |RequestFont()| to be called on each font with a
  // state of |kUnrequestedState| in the list, until a font is encountered with
  // a state of |kLoadedState|.
  GetPrimaryFont(): Font {
    // The primary font is lazily generated. If it hasn't been set yet, then it's
    // time to do it now.
    if (!this.primary_font_) {
      // Walk the list of fonts, requesting any encountered that are in an
      // unrequested state. The first font encountered that is loaded and whose
      // unicode range includes the space character is the primary font.
      // https://www.w3.org/TR/css-fonts-4/#first-available-font
      for (let  font_list_font of this.fonts_) {
        for (let face of font_list_font.faces) {
          let entry = face.entry;
          if (entry && !CharInRange(entry.unicode_range, kSpaceCharacter)) {
            continue;
          }
          if (face.state == State. kUnrequestedState) {
            this.RequestFont(font_list_font.family_name, face);
          }

          if (face.state == State. kLoadedState) {
            this.primary_font_ = face.font;
            DCHECK(this.primary_font_);
            return this.primary_font_!;
          }
        }
      }
    }
    DCHECK(this.primary_font_);
    return this.primary_font_!;
  }

  // Request a font from the font cache and update its state depending on the
  // results of the request. If the font is successfully set, then both its
  // |font_| and |character_map_| are non-NULL after this call.
  RequestFont(family: string, used_face: FontFace) {

    // Request the font from the font cache; the state of the font will be set
    // during the call.
    let { font, state } = this.font_cache_.TryGetFont(family, this.style_, this.size_, used_face.entry);
    state = state || State.kUnrequestedState;

    if (state == State.kLoadedState) {
      DCHECK(font);

      used_face.font = font;
    }
    used_face.state = state;
  }

  // Lazily generates the ellipsis font and ellipsis width. If it is already
  // generated then it immediately returns.
  GenerateEllipsisInfo() {
    if (!this.is_ellipsis_info_set_) {
      let { font, glyph_index } = this.GetCharacterFont(this.GetEllipsisValue());
      this.ellipsis_font_ = font;
      let ellipsis_glyph = glyph_index || kInvalidGlyphIndex;
      this.ellipsis_width_ = this.ellipsis_font_.GetGlyphWidth(ellipsis_glyph);

      this.is_ellipsis_info_set_ = true;
    }
  }

  // Lazily generates the space width. If it is already generated then it
  // immediately returns.
  GenerateSpaceWidth() {
    if (!this.is_space_width_set_) {
      let primary_font = this.GetPrimaryFont();
      let space_glyph = primary_font.GetGlyphForCharacter(kSpaceCharacter);
      let space_width_ = primary_font.GetGlyphWidth(space_glyph);
      if (space_width_ == 0) {
        DLOG(WARNING, 'Font being used with space width of 0!');
      }

      this.is_space_width_set_ = true;
    }
  }
}

function CharInRange(
  unicode_range: Set<UnicodeRange>,
  utf32_character: number) {
  if (!unicode_range.size) return true;
  for (let range of unicode_range.values()) {
    if (range.start > utf32_character) break;
    if ((range.start <= utf32_character) && (utf32_character <= range.end)) {
      return true;
    }
  }
  return false;
}
