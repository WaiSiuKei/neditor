// A script run represents a segment of text that can be shaped using a single
// skia::Font and UScriptCode combination.
import { FontProvider } from '../../render_tree/font_provider';
import { GlyphBuffer } from './sk_glyph_buffer';
import { RectF } from '../../math/rect_f';
import { NormalizeSpaces } from '../../base/unicode/character';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { Optional } from '@neditor/core/base/common/typescript';
import { GlyphIndex, kInvalidGlyphIndex } from '../../render_tree/glyph';
import { kZeroWidthSpaceCharacter } from '../../base/unicode/character_values';
import { DCHECK } from '@neditor/core/base/check';
import { Font as SkFont } from './sk_font';
import { Font } from '../../render_tree/font';
import { UnicodeString } from '@neditor/icu';
import { CanvasKit, TextBlob } from '@neditor/skia';

class ScriptRun {
  constructor(
    font: Font,
    script: number[],
    start_index: number,
    length: number,
  ) {
  }
}

type ScriptRuns = ScriptRun[]

// Internal class used for tracking the vertical bounds of a text buffer
// during shaping when bounds are requested (i.e. the passed in |maybe_bounds|
// is non-NULL).
class VerticalBounds {
//   public:
//     VerticalBounds()
// : min_y_(std::numeric_limits<float>::max()),
//   max_y_(std::numeric_limits<float>::min()) {}
//
  IncludeRange(min_y: number, max_y: number) {
    this.min_y_ = Math.min(this.min_y_, min_y);
    this.max_y_ = Math.max(this.max_y_, max_y);
  }
//
  GetY() {
    return this.IsValid() ? this.min_y_ : 0;
  }
  GetHeight() {
    return this.IsValid() ? this.max_y_ - this.min_y_ : 0;
  }

// private:
  private IsValid(): boolean {
    return this.max_y_ >= this.min_y_;
  }

  private min_y_ = Number.MAX_SAFE_INTEGER;
  private max_y_ = Number.MIN_SAFE_INTEGER;
};

// Describes a render_tree::TextShaper using skia and HarfBuzz to shape the
// text.
export class TextShaper {
  private skia: CanvasKit;
  constructor() {
    this.skia = CanvasKit;
  }
  // Shapes a utf-16 text buffer using the given font provider. The shaping
  // can be simple or complex, depending on the text provided.
  // |language| is used during complex shaping by HarfBuzz in order to allow it
  // to make shaping decisions more likely to be correct for the locale.
  // If |is_rtl| is true, then the glyphs in the text buffer will be reversed.
  // Returns a newly created glyph buffer, which can be used to render the
  // shaped text.
  CreateGlyphBuffer(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    language: string,
    is_rtl: boolean,
    font_provider: FontProvider): GlyphBuffer {
    let {
      maybe_bounds,
      text_blob,
      chars,
    } = this.ShapeText(text, text_start, text_length, language, is_rtl, font_provider, []);
    return new GlyphBuffer(maybe_bounds, chars, text_blob);
  }
  //
  //  // Shapes a utf-8 string using a single font. The shaping can be simple or
  //  // complex, depending on the text provided.
  //  // Returns a newly created glyph buffer, which can be used to render the
  //  // shaped text.
  //  scoped_refptr<GlyphBuffer> CreateGlyphBuffer(
  //      const std::string& utf8_string,
  //      const scoped_refptr<render_tree::Font>& font);
  //
  // Shapes a utf-16 text buffer using the given font provider. The shaping
  // can be simple or complex, depending on the text provided.  However, a glyph
  // buffer is not created from the shaping data. It is instead only used to
  // generate the width of the data when it is shaped.
  // Returns the width of the shaped text.
  GetTextWidth(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    language: string,
    is_rtl: boolean,
    font_provider: FontProvider,
    maybe_used_fonts: Font[] = []): number {
    let { maybe_bounds, } = this.ShapeText(text, text_start, text_length, language, is_rtl, font_provider, maybe_used_fonts, false);
    return maybe_bounds.width();
  }
  //
  //  // Purges any caches being used by the text shaper; currently, this consists
  //  // of the HarfBuzzFontProvider's cache.
  //  void PurgeCaches();
  //
  // private:
  //  // Internal class used for tracking the vertical bounds of a text buffer
  //  // during shaping when bounds are requested (i.e. the passed in |maybe_bounds|
  //  // is non-NULL).
  //  class VerticalBounds {
  //   public:
  //    VerticalBounds()
  //        : min_y_(std::numeric_limits<float>::max()),
  //          max_y_(std::numeric_limits<float>::min()) {}
  //
  //    void IncludeRange(float min_y, float max_y) {
  //      min_y_ = std::min(min_y_, min_y);
  //      max_y_ = std::max(max_y_, max_y);
  //    }
  //
  //    float GetY() const { return IsValid() ? min_y_ : 0; }
  //    float GetHeight() const { return IsValid() ? max_y_ - min_y_ : 0; }
  //
  //   private:
  //    bool IsValid() const { return max_y_ >= min_y_; }
  //
  //    float min_y_;
  //    float max_y_;
  //  };

  // Shape text relying on skia::Font and HarfBuzz.
  // Returns the width of the shaped text.
  // If |maybe_glyph_buffer| is non-NULL, it is populated with skia::GlyphBuffer
  // shaping data.
  // If |maybe_bounds| is non-NULL, it is populated with the bounds of the
  // shaped text.
  // If |maybe_used_fonts| is non-NULL, it is populated with all of the fonts
  // used during shaping.
  private ShapeText(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    language: string,
    is_rtl: boolean,
    font_provider: FontProvider,
    maybe_used_fonts: Font[] = [],
    create_text_blob = true,
  ): {
    text_blob: Optional<TextBlob>,
    chars: string,
    maybe_bounds: RectF,
  } {
    // Only set |maybe_vertical_bounds| to a non-NULL value when |maybe_bounds| is
    // non-NULL. Otherwise, the text bounds are not being calculated.
    // let maybe_vertical_bounds = vertical_bounds

    // Check for if the text contains a complex script, meaning that it requires
    // HarfBuzz. If it does, then attempt to collect the scripts. In the event
    // that this fails, fall back to the simple shaper.
    // let  script_runs:  ScriptRuns
    //  if ( ContainsComplexScript(text_buffer) &&
    //    CollectScriptRuns(text_buffer, text_length, font_provider)) {
    //    NOTIMPLEMENTED()
    // // If the direction is RTL, then reverse the script runs, so that the glyphs
    // // will be added in the correct order.
    // if (is_rtl) {
    //   std::reverse(script_runs.begin(), script_runs.end());
    // }
    //
    // for (int i = 0; i < script_runs.size(); ++i) {
    //   ScriptRun& run = script_runs[i];
    //   const base::char16* script_run_text_buffer =
    //     text_buffer + run.start_index;
    //
    //   // Check to see if the script run requires HarfBuzz. Because HarfBuzz
    //   // shaping is much slower than simple shaping, we only want to run
    //   // HarfBuzz shaping on the bare minimum possible, so any script run
    //   // that doesn't contain complex scripts will be simply shaped.
    //   if (base::unicode::ContainsComplexScript(script_run_text_buffer,
    //     run.length)) {
    //     ShapeComplexRun(script_run_text_buffer, run, language, is_rtl,
    //       font_provider, maybe_builder, maybe_vertical_bounds,
    //       maybe_used_fonts, &total_width);
    //   } else {
    //     ShapeSimpleRunWithDirection(script_run_text_buffer, run.length, is_rtl,
    //       font_provider, maybe_builder,
    //       maybe_vertical_bounds, maybe_used_fonts,
    //     &total_width);
    //   }
    // }
    // } else {
    let {
      text_blob,
      chars,
      maybe_vertical_bounds: vertical_bounds,
      current_width: total_width
    } = this.ShapeSimpleRunWithDirection(text, text_start, text_length, is_rtl, font_provider, maybe_used_fonts, create_text_blob);
    // }

    // If |maybe_bounds| has been provided, then update the width of the bounds
    // with the total width of all of the shaped glyphs. The height is already
    // correct.
    let maybe_bounds = new RectF(0, vertical_bounds.GetY(), total_width,
      vertical_bounds.GetHeight());

    return {
      text_blob,
      chars,
      maybe_bounds,
    };
  }
  //
  //  // Populate a ScriptRuns object with all runs of text containing a single
  //  // skia::Font and UScriptCode combination.
  //  // Returns false if the script run collection fails.
  //  bool CollectScriptRuns(const base::char16* text_buffer, size_t text_length,
  //                         render_tree::FontProvider* font_provider,
  //                         ScriptRuns* runs);
  //
  //  // Shape a complex text run using HarfBuzz.
  //  void ShapeComplexRun(const base::char16* text_buffer,
  //                       const ScriptRun& script_run, const std::string& language,
  //                       bool is_rtl, render_tree::FontProvider* font_provider,
  //                       SkTextBlobBuilder* maybe_builder,
  //                       VerticalBounds* maybe_vertical_bounds,
  //                       render_tree::FontVector* maybe_used_fonts,
  //                       float* current_width);
  //
  // Shape a simple text run. In the case where the direction is RTL, the text
  // will be reversed.
  private ShapeSimpleRunWithDirection(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    is_rtl: boolean,
    font_provider: FontProvider,
    maybe_used_fonts: Font[] = [],
    create_text_blob = true
  ): {
    text_blob: Optional<TextBlob>,
    chars: string,
    maybe_vertical_bounds: VerticalBounds,
    current_width: number
  } {
// If the text has an RTL direction and a builder was provided, then reverse
    // the text. This ensures that the glyphs will appear in the proper order
    // within the glyph buffer. The width and bounds do not rely on the direction
    // of the text, so in the case where there is no builder, reversing the text
    // is not necessary.
    if (is_rtl) {
      NOTIMPLEMENTED();
      // Ensure that the local text buffer is large enough to hold the reversed
      // string.
      this.EnsureLocalTextBufferHasSize(text_length);

      // Both reverse the text and replace mirror characters so that characters
      // such as parentheses will appear in the proper direction.
      // bool error = false;
      // unsigned int reversed_buffer_length = 0;
      // unsigned int buffer_position = text_length;
      // while (buffer_position > 0) {
      //   UChar32 character;
      //   U16_PREV(text_buffer, 0, buffer_position, character);
      //   character = u_charMirror(character);
      //   U16_APPEND(local_text_buffer_.get(), reversed_buffer_length, text_length,
      //     character, error);
      // }
      //
      // ShapeSimpleRun(local_text_buffer_.get(), reversed_buffer_length,
      //   font_provider, maybe_builder, maybe_vertical_bounds,
      //   maybe_used_fonts, total_width);
    } else {
      let maybe_used_fonts: Font[] = [];
      let maybe_vertical_bounds = new VerticalBounds();
      let {
        text_blob,
        chars,
        current_width
      } = this.ShapeSimpleRun(text, text_start, text_length, font_provider, maybe_vertical_bounds, maybe_used_fonts, 0, create_text_blob);
      return {
        text_blob,
        chars,
        current_width,
        maybe_vertical_bounds,
      };
    }
  }

  // Shape a simple text run, relying on the skia::Font objects provided by the
  // FontProvider to determine the shaping data.
  // FIXME: 支持多种 font
  private ShapeSimpleRun(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    font_provider: FontProvider,
    maybe_vertical_bounds?: VerticalBounds,
    maybe_used_fonts?: Font[],
    total_width: number = 0,
    create_text_blob = true,
  ): {
    text_blob: Optional<TextBlob>,
    chars: string,
    current_width: number
  } {
    let last_font: Optional<Font> = undefined;
    let glyph_list: GlyphIndex[] = [];
    let chars: string = ''

    // Walk through each character within the run.
    for (let i = 0; i < text_length; i++) {
      const char = text.charAt(i + text_start);

      // Retrieve the current character and normalize spaces and zero width
      // spaces before processing it.
      let character = NormalizeSpaces(char);
      let glyph = kInvalidGlyphIndex;

      // If a zero width space character is encountered, simply continue on. It
      // doesn't impact the width or shaping data.
      if (character == kZeroWidthSpaceCharacter) {
        continue;
      }

      // Look up the font and glyph for the current character.
      let { font, glyph_index } = font_provider.GetCharacterFont(character);
      let current_font = font as Font;
      glyph = glyph_index;

      if (glyph_list.length > 0 && last_font != current_font) {
        NOTREACHED();
      }

      chars += String.fromCodePoint(character)
      let glyph_bounds = current_font.GetGlyphBounds(glyph);
      let glyph_width = current_font.GetGlyphWidth(glyph)
      total_width += glyph_width

      // If |maybe_vertical_bounds| has been provided, then we're updating it with
      // the vertical bounds of all of the shaped glyphs.
      if (maybe_vertical_bounds) {
        maybe_vertical_bounds.IncludeRange(glyph_bounds.y(),
          glyph_bounds.bottom());
      }

      last_font = current_font;
      glyph_list.push(glyph);
    }

    // If there's a builder (meaning that a glyph buffer is being generated), and
    // at least one glyph was generated, then we need to add the final font run
    // into the glyph buffer.
    // if (maybe_builder && glyph_count > 0) {
    //   DCHECK(last_font);
    //   TryAddFontToUsedFonts(last_font!, maybe_used_fonts);
    //   AddFontRunToGlyphBuffer(font_provider, last_font, glyph_count,
    //     maybe_builder);
    // }
    let text_blob: Optional<TextBlob>;
    if (glyph_list.length > 0) {
      DCHECK(last_font);
      if (maybe_used_fonts) {
        TryAddFontToUsedFonts(last_font!, maybe_used_fonts);
      }
      if (create_text_blob) {
        text_blob = this.MakeTextBlob(glyph_list, last_font!);
      }
    }

    return {
      text_blob,
      chars,
      current_width: total_width,
    };
  }

  private MakeTextBlob(glyphs: GlyphIndex[], font: Font): TextBlob {
    return this.skia.TextBlob.MakeFromGlyphs(glyphs, (font as SkFont).GetSkFont());
  }
  //
  //  // Verifies that the glyph arrays have the required size allocated. If they do
  //  // not, then the arrays are re-allocated with the required size.
  //  void EnsureLocalGlyphArraysHaveSize(size_t size);
  //  // Verifies that the local text buffer has the required size allocated. If it
  //  // does not, then the buffer is re-allocated with the required size.
  private EnsureLocalTextBufferHasSize(size: number) {
    if (this.local_text_buffer_size_ < size) {
      this.local_text_buffer_size_ = size;
      this.local_text_buffer_ = 0;
      // this.local_text_buffer_.reset(new base::char16[size]);
    }
  }
  //
  //  // Lock used during shaping to ensure it does not occur on multiple threads at
  //  // the same time.
  //  base::Lock shaping_mutex_;
  //
  //  // Provides fonts needed by HarfBuzz during complex shaping.
  //  HarfBuzzFontProvider harfbuzz_font_provider_;
  //
  //  // The allocated glyph and positions data. This is retained in between shaping
  //  // calls to prevent constantly needing to allocate the arrays. In the case
  //  // where a larger array is needed than the current size, larger arrays are
  //  // allocated in their place.
  //  size_t local_glyph_array_size_;
  //  std::unique_ptr<render_tree::GlyphIndex[]> local_glyphs_;
  //  std::unique_ptr<SkScalar[]> local_positions_;
  //
  //  // The allocated text buffer used by complex shaping when normalizing the
  //  // text.
  local_text_buffer_size_: number = 0;
  local_text_buffer_: number = 0;
};

function TryAddFontToUsedFonts(font: Font, maybe_used_fonts: Font[]) {
  if (!maybe_used_fonts) {
    return;
  }
  if (!font) {
    return;
  }

  // Verify that the font has not already been added to the used fonts, before
  // adding it to the end.
  if (maybe_used_fonts.includes(font)) return;

  maybe_used_fonts.push(font);
}
