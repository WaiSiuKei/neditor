// A ResourceProvider is a thread-safe class that is usually provided by
// a specific render_tree consumer.  Its purpose is to generate render_tree
// resources that can be attached to a render_tree that would subsequently be
// submitted to that specific render_tree consumer.  While it depends on the
// details of the ResourceProvider, it is very likely that resources created by
// a ResourceProvider that came from a specific render_tree consumer should only
// be submitted back to that same render_tree consumer.  The object should be
// thread-safe since it will be very common for resources to be created on one
// thread, but consumed on another.
import { Typeface } from './typeface';
import { Font, FontStyle } from './font';
import { GlyphBuffer } from './glyph_buffer';
import { FontProvider } from './font_provider';
import { Node } from './node';
import { AlphaFormat, Image, ImageData, PixelFormat } from './image';
import { Size } from '../math/size';
import { UnicodeString } from "@neditor/icu";

export type RawTypefaceDataVector = number[]

export abstract class ResourceProvider {

  // This matches the max size in WebKit
  // static kMaxTypefaceDataSize = 30 * 1024 * 1024;  // 30 MB

  // Blocks until it can be guaranteed that all resource-related operations have
  // completed.  This might be important if we would like to ensure that memory
  // allocations or deallocations have occurred before proceeding with a memory
  // intensive operation.
  // abstract Finish(): void

  // Returns true if AllocateImageData() supports the given |pixel_format|.
  abstract PixelFormatSupported(pixel_format: PixelFormat): boolean

  // Returns true if AllocateImageData() supports the given |alpha_format|.
  abstract AlphaFormatSupported(alpha_format: AlphaFormat): boolean

  // This method can be used to create an ImageData object.
  abstract AllocateImageData(
    size: Size, pixel_format: PixelFormat,
    alpha_format: AlphaFormat): ImageData

  // This function will consume an ImageData object produced by a call to
  // AllocateImageData(), wrap it in a render_tree::ImageParser that can be
  // used in a render tree, and return it to the caller.
  abstract CreateImage(pixel_data: ImageData): Image

  // This function will consume an SbDecodeTarget object produced by
  // SbDecodeTargetCreate(), wrap it in a render_tree::ImageParser that can be used
  // in a render tree, and return it to the caller.
//  virtual scoped_refptr<ImageParser> CreateImageFromSbDecodeTarget(
//      SbDecodeTarget target) = 0;

  // Whether SbDecodeTargetIsSupported or not.
//  virtual bool SupportsSbDecodeTarget() = 0;

  // Return the SbDecodeTargetGraphicsContextProvider associated with the
  // ResourceProvider, if it exists.  Returns NULL if SbDecodeTarget is not
  // supported.
//  virtual SbDecodeTargetGraphicsContextProvider*
//  GetSbDecodeTargetGraphicsContextProvider() = 0;

  // Returns a raw chunk of memory that can later be passed into a function like
  // CreateMultiPlaneImageFromRawMemory() in order to create a texture.
  // If possible, the memory returned will be GPU memory that can be directly
  // addressable by the GPU as a texture.
  // Creating textures through this method is discouraged since you must be
  // aware of your platform's image alignment/pitch requirements in order to
  // create a valid texture.  The function is useful in situations where, for
  // example, a video decoder requires a raw chunk of memory to decode, but is
  // not able to provide image format information until after it begins
  // decoding.
  // abstract AllocateRawImageMemory(
  //   size_in_bytes: number, alignment: number): RawImageMemory

  // Constructs a multi-plane image from a single contiguous chunk of raw
  // image memory.  Data for all planes of the image must lie within
  // raw_image_memory, and the descriptor's plane offset member will describe
  // where a particular plane's data lies relative to raw_image_memory.
  // Note that use of this function is discouraged, if possible, since filling
  // out the descriptor requires knowledge of the specific platform's texture
  // alignment/pitch requirements.
  // abstract CreateMultiPlaneImageFromRawMemory(
  //   raw_image_memory: RawImageMemory,
  //   descriptor: MultiPlaneImageDataDescriptor): ImageParser

  // Given a font family name, this method returns whether or not a local font
  // matching the name exists.
  abstract HasLocalFontFamily(font_family_name: string): boolean

  // Given a set of typeface information, this method returns the locally
  // available typeface that best fits the specified parameters. In the case
  // where no typeface is found that matches the font family name, the zero
  // typeface is returned.
  abstract GetLocalTypeface(font_family_name: string,
                            font_style: FontStyle): Typeface

  // Loads additional fonts that should be loaded asynchronously at startup.
  // abstract LoadAdditionalFonts(): void

  // Given a set of typeface information, this method returns the locally
  // available typeface that best fits the specified parameters. In the case
  // where no typeface is found that matches the font family name, NULL is
  // returned.
  //
  // Font's typeface (aka face name) is combination of a style and a font
  // family.  Font's style consists of weight, and a slant (but not size).
  // abstract GetLocalTypefaceByFaceNameIfAvailable(font_face_name: string): Typeface

  // Given a UTF-32 character, a set of typeface information, and a language,
  // this method returns the best-fit locally available fallback typeface that
  // provides a glyph for the specified character. In the case where no fallback
  // typeface is found that supports the character, the zero typeface is
  // returned.
  abstract GetCharacterFallbackTypeface(
    utf32_character: number, font_style: FontStyle,
    language: string): Typeface

  // Given raw typeface data in either TrueType, OpenType or WOFF data formats,
  // this method creates and returns a new typeface. The typeface is not cached
  // by the resource provider. If the creation fails, the error is written out
  // to the error string.
  // Note that kMaxFontDataSize represents a hard cap on the raw data size.
  // Anything larger than that is guaranteed to result in typeface creation
  // failure.
  // abstract CreateTypefaceFromRawData(
  //   raw_data: RawTypefaceDataVector,
  // ): { type_face: Typeface, error_string?: string }

  // Given a UTF-16 text buffer, a font provider, and other shaping parameters,
  // this method shapes the text using fonts from the list and returns the glyph
  // buffer that will render it.
  // - |language| is an ISO 639-1 code used to enable the shaper to make
  //   more accurate decisions when character combinations that can produce
  //   different outcomes are encountered during shaping.
  // - If |is_rtl| is set to true, then the glyphs in the glyph buffer
  //   will be returned in reversed order.
  // - |font_list| is used to provide the shaper with a font-glyph combination
  //   for any requested character. The available fonts and the strategy used in
  //   determining the best font-glyph combination are encapsulated within the
  //   FontProvider object.
  abstract CreateGlyphBuffer(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    language: string, is_rtl: boolean,
    font_provider: FontProvider): GlyphBuffer

  // Given a UTF-8 string and a single font, this method shapes the string
  // using the font and returns the glyph buffer that will render it.
  // abstract CreateGlyphBuffer(
  //   utf8_string: string,
  //   font: Font): GlyphBuffer

  // Given a UTF-16 text buffer, a font provider, and other shaping parameters,
  // this method shapes the text using fonts from the list and returns the
  // width of the shaped text.
  // - |language| is an ISO 639-1 code used to enable the shaper to make
  //   more accurate decisions when character combinations that can produce
  //   different outcomes are encountered during shaping.
  // - If |is_rtl| is set to true, then the shaping will be generated in reverse
  //   order.
  // - |font_list| is used to provide the shaper with a font-glyph combination
  //   for any requested character. The available fonts and the strategy used in
  //   determining the best font-glyph combination are encapsulated within the
  //   FontProvider object.
  // - |maybe_used_fonts| is an optional parameter used to collect all fonts
  //   that were used in generating the width for the text.
  // NOTE: While shaping is done on the text in order to produce an accurate
  // width, a glyph buffer is never generated, so this method should be
  // faster than CreateGlyphBuffer().
  abstract GetTextWidth(text: UnicodeString,
                        text_start: number,
                        text_length: number,
                        language: string,
                        is_rtl: boolean,
                        font_provider: FontProvider,
                        maybe_used_fonts?: Font[]): number

  // This function will wrap the given Lottie animation data into a
  // LottieAnimation that can be used in a render tree, and return it to the
  // caller.
//  virtual scoped_refptr<LottieAnimation> CreateLottieAnimation(
//      const char* data, size_t length) = 0;

  // Consumes a list of vertices and returns a Mesh instance.
//  virtual scoped_refptr<Mesh> CreateMesh(
//      std::unique_ptr<std::vector<Mesh::Vertex> > vertices,
//      Mesh::DrawMode draw_mode) = 0;

  abstract DrawOffscreenImage(root: Node): Image
}

