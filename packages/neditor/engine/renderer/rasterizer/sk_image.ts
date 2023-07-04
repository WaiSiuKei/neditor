import { Image as BaseImage, MultiPlaneImageFormat, PixelFormat } from '../../render_tree/image';
import { baseGetTypeId, TypeId } from '../../base/type_id';
import { Size } from '../../math/size';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Optional } from '@neditor/core/base/common/typescript';
import { RectF } from '../../math/rect_f';
import { SkImage } from './skia/sk_image';
// Introduce a base class for both software and hardware Skia images.  They
// should both be able to return a SkBitmap that can be used in subsequent
// Skia draw calls.
export abstract class Image extends BaseImage {

  // Ensures that any queued backend initialization of this image object is
  // completed after this method returns.  This can only be called from the
  // rasterizer thread.  When an ImageParser is created (from any thread), the
  // construction of its backend is message queued to be initialized on the
  // render thread, however it is possible (via animations) for the image
  // to be referenced in a render tree before then, and thus this function will
  // fast-track the initialization of the backend object if it has not yet
  // executed.
  // Returns true if an initialization actually took place.
  abstract EnsureInitialized(): boolean

  // A helper function for DCHECKing that given image data is indeed in
  // premultiplied alpha format.  Note that because of the nature of
  // premultiplied alpha, it is possible for a non-premultiplied alpha image
  // to slip by these checks.
  static DCheckForPremultipliedAlpha(
    dimensions: Size,
    source_pitch_in_bytes: number,
    pixel_format: PixelFormat,
    source_pixels: number[]) {
    NOTIMPLEMENTED();
  }

  // While of course most skia::ImageParser objects can be rendered in Skia, sometimes
  // this is not true, such as when they are backed by SbDecodeTarget objects
  // that assume a specific rasterizer such as GLES2.  In this case, we can
  // fallback to a rasterizer-provided renderer function.
  CanRenderInSkia() { return true; }
};

// A single-plane image is an image where all data to describe a single pixel
// is stored contiguously.  This style of image is by far the most common.
export abstract class SinglePlaneImage extends Image {

  abstract GetImage(): SkImage

  GetTypeId() {
    return baseGetTypeId(SinglePlaneImage);
  }

  // If GLES2 is backing this image, this function can be called to return a
  // reference to that EGL texture.
  // virtual const backend::TextureEGL* GetTextureEGL() const { return NULL; }

  // If not-null, indicates a rectangle within the image in which the valid
  // pixel data is to be found.
  // GetContentRegion(): Optional<RectF> { return undefined; }
};

// A multi-plane image is one where different channels may have different planes
// (i.e. sub-images) stored in different regions of memory.  A multi-plane
// image can be defined in terms of a set of single-plane images.
export abstract class MultiPlaneImage extends Image {

  abstract GetFormat(): MultiPlaneImageFormat
  // virtual const backend::TextureEGL* GetTextureEGL(int plane_index) const {
  //   return NULL;
  // }

  GetTypeId() {
    return baseGetTypeId(MultiPlaneImage);
  }

  // All currently supported MultiPlaneImage formats do not feature alpha.
  IsOpaque() { return true; }
};

