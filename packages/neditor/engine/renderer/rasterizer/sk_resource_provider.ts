// This class must be thread-safe and capable of creating resources that
// are to be consumed by this skia hardware rasterizer.  It must be constructed
// on the thread that will be visiting submitted render trees.
import { ResourceProvider } from '../../render_tree/resource_provider';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { GlyphBuffer } from '../../render_tree/glyph_buffer';
import { FontProvider } from '../../render_tree/font_provider';
import { Font, FontStyle } from '../../render_tree/font';
import { Barrier } from '@neditor/core/base/common/async';
import { Typeface } from './sk_typeface';
import { TextShaper } from './text_shaper';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Node } from '../../render_tree/node';
import { AlphaFormat, Image, PixelFormat, ImageData } from '../../render_tree/image';
import { Size } from '../../math/size';
import { DCHECK } from '@neditor/core/base/check';
import { SoftwareImage, SoftwareImageData } from './software_image';
import { UnicodeString } from '@neditor/icu';
import { CanvasKit } from '@neditor/skia';
// @ts-ignore
import RototoFont from './Roboto-Regular.ttf';
// @ts-ignore
import SourceFont from './SourceHanSansCN-Normal.ttf';

export const kDefaultFont = 'Roboto';

export class SkResourceProvider extends ResourceProvider {
  init = new Barrier<void>();
  fontReady = new Barrier<void>();
  private fontDatas = new Map<string, ArrayBuffer>();
  private text_shaper_: TextShaper;

  constructor() {
    super();
    this.text_shaper_ = new TextShaper();
    this.LoadFont();
  }

  private async LoadFont() {
    let resp = await fetch(RototoFont);
    let buffer = await resp.arrayBuffer();
    this.fontDatas.set('Roboto', buffer);
    let resp2 = await fetch(SourceFont);
    let buffer2 = await resp2.arrayBuffer();
    this.fontDatas.set('"source han sans"', buffer2);
    this.fontReady.open();
  }

  CreateGlyphBuffer(text: UnicodeString, text_start: number, text_length: number, language: string, is_rtl: boolean, font_provider: FontProvider): GlyphBuffer {
    return this.text_shaper_.CreateGlyphBuffer(text, text_start, text_length, language, is_rtl, font_provider);
  }
  GetCharacterFallbackTypeface(utf32_character: number, font_style: FontStyle, language: string): Typeface {
    return this.GetDefaultTypeface();
  }
  private typeface_map_ = new Map<string, Typeface>();
  private GetTypeface(font_family_name: string = kDefaultFont) {
    if (!this.typeface_map_.has(font_family_name)) {
      const font_data = this.fontDatas.get(font_family_name)!;
      let font_manager = CanvasKit.FontMgr.RefDefault();
      let sk_typeface = font_manager.MakeTypefaceFromData(font_data);
      const typeface = new Typeface(sk_typeface);
      this.typeface_map_.set(font_family_name, typeface);
    }
    return this.typeface_map_.get(font_family_name)!;
  }
  GetLocalTypeface(font_family_name: string, font_style: FontStyle): Typeface {
    if (!this.HasLocalFontFamily(font_family_name)) NOTREACHED();
    return this.GetTypeface(font_family_name);
  }
  private GetDefaultTypeface() {
    return this.GetTypeface();
  }
  GetTextWidth(text: UnicodeString, text_start: number, text_length: number, language: string, is_rtl: boolean, font_provider: FontProvider, maybe_used_fonts: Font[] = []): number {
    return this.text_shaper_.GetTextWidth(text, text_start, text_length, language, is_rtl,
      font_provider, maybe_used_fonts);
  }
  HasLocalFontFamily(font_family_name: string): boolean {
    TRACE_EVENT0('cobalt::renderer',
      'HardwareResourceProvider::HasLocalFontFamily()');

    return this.fontDatas.has(font_family_name);
  }
  DrawOffscreenImage(root: Node): Image {
    NOTIMPLEMENTED();
  }
  PixelFormatSupported(pixel_format: PixelFormat): boolean {
    return pixel_format == PixelFormat.kPixelFormatRGBA8 ||
      pixel_format == PixelFormat.kPixelFormatUYVY;
  }
  AllocateImageData(size: Size, pixel_format: PixelFormat, alpha_format: AlphaFormat): ImageData {
    TRACE_EVENT0('cobalt::renderer',
      'HardwareResourceProvider::AllocateImageData()');
    DCHECK(this.PixelFormatSupported(pixel_format));
    DCHECK(this.AlphaFormatSupported(alpha_format));
    return new SoftwareImageData(size, pixel_format, alpha_format);
  }
  AlphaFormatSupported(alpha_format: AlphaFormat): boolean {
    return alpha_format == AlphaFormat.kAlphaFormatPremultiplied ||
      alpha_format == AlphaFormat.kAlphaFormatOpaque;
  }
  CreateImage(source_data: ImageData): Image {

    TRACE_EVENT0('cobalt::renderer', 'SoftwareResourceProvider::CreateImage()');
    let skia_source_data = source_data as SoftwareImageData;

    return new SoftwareImage(skia_source_data);
  }
}
