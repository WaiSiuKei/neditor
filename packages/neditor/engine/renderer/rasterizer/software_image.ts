import { AlphaFormat, BytesPerPixel, ImageData, ImageDataDescriptor, PixelFormat } from '../../render_tree/image';
import { Size } from '../../math/size';
import { SinglePlaneImage } from './sk_image';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { SkImage } from './skia/sk_image';
import { CanvasKit } from '@neditor/skia';

export class SoftwareImageData extends ImageData {
  constructor(
    size: Size,
    pixel_format: PixelFormat,
    alpha_format: AlphaFormat
  ) {
    super();
    this.descriptor_ = new ImageDataDescriptor(size, pixel_format, alpha_format,
      size.width() * BytesPerPixel(pixel_format));
  }

  GetDescriptor() {
    return this.descriptor_;
  }

  GetMemory() {
    return this.pixel_data_;
  }
  SetMemory(mem: Uint8Array) {
    this.pixel_data_ = mem;
  }

  private descriptor_: ImageDataDescriptor;
  private pixel_data_: Uint8Array = new Uint8Array;
};

export class SoftwareImage extends SinglePlaneImage {

  constructor(
    source_data: SoftwareImageData | Uint8Array,
    descriptor?: ImageDataDescriptor
  ) {
    super();
    if (source_data instanceof SoftwareImageData) {
      this.owned_pixel_data_ = source_data.GetMemory().slice();
      this.Initialize(this.owned_pixel_data_, source_data.GetDescriptor());
    } else {
      this.Initialize(source_data, descriptor!);
    }
  }

  GetSize() { return this.size_ !; }

  GetImage() { return this.image_!; }

  EnsureInitialized() { return false; }

  IsOpaque() { return this.is_opaque_!; }

  private Initialize(source_data: Uint8Array, descriptor: ImageDataDescriptor) {
    this.is_opaque_ = (descriptor.alpha_format == AlphaFormat.kAlphaFormatOpaque);
    // let skia_alpha_format =
    //   RenderTreeAlphaFormatToSkia(descriptor.alpha_format);
    // DCHECK_EQ(kPremul_SkAlphaType, skia_alpha_format);
    //
    this.size_ = descriptor.size;

    if (descriptor.pixel_format == PixelFormat.kPixelFormatUV8) {
      // TODO: SKIA_M61_UNFINISHED_IMPLEMENTATION: fix me
      // Convert UV8 to ARGB because Skia does not support any two-channel
      // formats.  This of course is not efficient, but efficiency in the software
      // renderer is not as important as completeness and correctness.
      // ConvertUV8ToARGBSkBitmap(source_data, descriptor, image_.get());
      NOTIMPLEMENTED();
    } else {
      // Check that the incoming pixel data is indeed in premultiplied alpha
      // format.

      // Convert our incoming pixel data from unpremultiplied alpha to
      // premultiplied alpha format, which is what Skia expects.
      // let  premul_image_info = this.CanvasKit_. ImageInfo.Make(
      //   descriptor.size.width(), descriptor.size.height(),
      //   RenderTreeSurfaceFormatToSkia(descriptor.pixel_format),
      //   skia_alpha_format);
      // SkBitmap bitmap;
      // bitmap.installPixels(premul_image_info, source_data,
      //   descriptor.pitch_in_bytes);
      // image_ = SkImage::MakeFromBitmap(bitmap);
      this.image_ = CanvasKit.MakeImageFromEncoded(source_data)!;
    }
  }
  //
  private owned_pixel_data_ ?: Uint8Array;
  private image_?: SkImage;
  private size_?: Size;
  private is_opaque_?: boolean;
};
