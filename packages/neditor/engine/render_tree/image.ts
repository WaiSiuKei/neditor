// Formats of pixel data that we support creating images from.
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { Size } from '../math/size';
import { DCHECK_GT, DCHECK_LE } from '@neditor/core/base/check_op';
import { TypeId } from '../base/type_id';

export enum PixelFormat {
  kPixelFormatRGBA8,
  kPixelFormatBGRA8,
  kPixelFormatUYVY,
  kPixelFormatY8,
  kPixelFormatU8,
  kPixelFormatV8,
  kPixelFormatUV8,
  kPixelFormatInvalid,
};

export function BytesPerPixel(pixel_format: PixelFormat): number {
  switch (pixel_format) {
    case PixelFormat.kPixelFormatRGBA8:
      return 4;
    case PixelFormat.kPixelFormatBGRA8:
      return 4;
    case PixelFormat.kPixelFormatY8:
      return 1;
    case  PixelFormat.kPixelFormatU8:
      return 1;
    case  PixelFormat.kPixelFormatV8:
      return 1;
    case PixelFormat.kPixelFormatUV8:
      return 2;
    case PixelFormat.kPixelFormatUYVY:
    case PixelFormat.kPixelFormatInvalid:
      NOTREACHED();
  }
  return -1;
}

export enum AlphaFormat {
  // Premultiplied alpha means that the RGB components (in terms of
  // the range [0.0, 1.0]) have already been multiplied by the A component
  // (also in the range [0.0, 1.0]).  Thus, it is expected that for all
  // pixels, each component is less than or equal to the alpha component.
  kAlphaFormatPremultiplied,

  // This alpha format implies standard alpha, where each component is
  // independent of the alpha.
  kAlphaFormatUnpremultiplied,

  // Indicates that all alpha values in the image data are opaque.  If
  // non-opaque alpha data is used with this format, visual output will be
  // undefined. This information may be used to enable optimizations, and can
  // result in ImageParser::IsOpaque() returning true.
  kAlphaFormatOpaque,
}

// Describes the format of a contiguous block of memory that represents an
// image.  This descriptor can only describe image formats where all information
// for a given pixel is stored contiguously in memory, and all pixels are
// sequentially ordered.  For image data that is stored within multiple planes,
// see MultiPlaneImageDataDescriptor below.
export class ImageDataDescriptor {
  constructor(
    public size: Size,
    public pixel_format: PixelFormat,
    public alpha_format: AlphaFormat,
    public pitch_in_bytes: number,
  ) {}
}

// ImageData is an interface for an object that contains an allocation
// of CPU-accessible memory that is intended to be passed in to CreateImage()
// so that it may be used by the GPU.
export abstract class ImageData {

  // Returns information about the kind of data this ImageData is
  // intended to store.
  abstract GetDescriptor(): ImageDataDescriptor

  // Returns a pointer to the image data so that one can set pixel data as
  // necessary.
  abstract GetMemory(): Uint8Array

  abstract SetMemory(mem: Uint8Array): void
}

export abstract class RawImageMemory {
  abstract GetSizeInBytes(): number
  abstract GetMemory(): number
}

// Specifies formats for multi-plane images, typically produced by video
// decoders.
export enum MultiPlaneImageFormat {
  // A YUV image where each channel, Y, U and V, is stored as a separate
  // single-channel image plane.  Its pixels are mapped to RGB using BT. 601
  // standard.  Each of the channel is represented by a value between [0, 255].
  kMultiPlaneImageFormatYUV3PlaneBT601FullRange,
  // A YUV image where each channel, Y, U and V, is stored as a separate
  // single-channel image plane.  Its pixels are mapped to RGB using BT. 709
  // standard.  Each of the channel is represented by a value between [16, 235].
  kMultiPlaneImageFormatYUV3PlaneBT709,
  // A YUV image where the Y channel is stored as a single-channel image plane
  // and the U and V channels are interleaved in a second image plane.  Its
  // pixels are mapped to RGB using BT. 709 standard.  Each of the channel is
  // represented by a value between [16, 235].
  kMultiPlaneImageFormatYUV2PlaneBT709,
  // A YUV image where each channel, Y, U and V, is stored as a separate
  // single-channel 10bit unnormalized image plane.
  kMultiPlaneImageFormatYUV3Plane10BitBT2020,
};

// Like the ImageDataDescriptor object, a MultiPlaneImageDataDescriptor
// describes the format of a multiplane image pixel data.  A multi plane
// image is an image who's pixel data is split among multiple contiguous
// regions of memory (planes).  For example, many video decoders output
// YUV image data where each of the three channels, Y, U and V, are stored
// separately as their own single channel images.
// The MultiPlaneImageDataDescriptor describes each channel in terms of a
// standard single plane ImageDataDescriptor object.  In addition, a
// MultiPlaneImageFormat label is also assigned to the the image to describe
// how separate channels should be combined to form the final image.
export class MultiPlaneImageDataDescriptor {
  // For efficiency reasons (to avoid dynamic memory allocations) we define a
  // maximum number of supported planes.
  static kMaxPlanes = 3;

  constructor(image_format: MultiPlaneImageFormat) {
    this.image_format_ = image_format;
    this.num_planes_ = 0;
  }

  // Pushes a new plane descriptor onto the list of planes.  Multi-plane images
  // are defined over one large contiguous region of memory, and each plane
  // occupies a subset of that memory.  The offset parameter specifies where
  // to find the newly added plane relative to a contiguous region of memory.
  // For example, in 3 plane YUV, the V plane would have an offset at least
  // larger than the size of the data for the Y plane plus the U plane.
  AddPlane(offset: number, descriptor: ImageDataDescriptor) {
    DCHECK_GT(MultiPlaneImageDataDescriptor.kMaxPlanes, this.num_planes_);
    this.plane_descriptors_[this.num_planes_] = new PlaneInformation(offset, descriptor);
    ++this.num_planes_;
  }

  // Returns the multi-plane image format of this image as a whole.
  image_format() { return this.image_format_; }

  // Returns the number of planes described by this descriptor (i.e. the number
  // of times AddPlane() has been called).
  num_planes() { return this.num_planes_; }

  // Returns the offset specified by AddPlane() for the given plane_index.
  GetPlaneOffset(plane_index: number): number {
    DCHECK_LE(0, plane_index);
    DCHECK_GT(this.num_planes_, plane_index);
    return this.plane_descriptors_[plane_index].offset;
  }

  // Returns the single-plane image descriptor specified by AddPlane() for the
  // given plane_index.
  GetPlaneDescriptor(plane_index: number): ImageDataDescriptor {
    DCHECK_LE(0, plane_index);
    DCHECK_GT(this.num_planes_, plane_index);
    return this.plane_descriptors_[plane_index].descriptor;
  }

  private image_format_: MultiPlaneImageFormat;
  private num_planes_: number;

  // We keep an array of base::optionals so that we don't have to specify a
  // default constructor for PlaneInformation.
  plane_descriptors_: Array<PlaneInformation> = new Array(MultiPlaneImageDataDescriptor.kMaxPlanes);
};

class PlaneInformation {
  constructor(
    public offset: number,
    public descriptor: ImageDataDescriptor,
  ) {}
};

// The ImageParser type is an abstract base class that represents a stored image
// and all of its pixel information.  When constructing a render tree,
// external images can be introduced by adding an ImageNode and associating it
// with a specific ImageParser object.  Examples of concrete ImageParser objects include
// an ImageParser that stores its pixel data in a CPU memory buffer, or one that
// stores its image data as a GPU texture.  Regardless, the concrete type of
// an ImageParser objects is not relevant unless the ImageParser is being constructed or
// it is being read by a rasterizer reading a submitted render tree.  Since
// the rasterizer may only be compatible with specific concrete ImageParser types,
// it is expected that the object will be safely downcast by the rasterizer
// to a rasterizer-specific ImageParser type using base::polymorphic_downcast().
export abstract class Image {
  abstract GetSize(): Size

  // The default implementation is to estimate the size based on the width and
  // height. Derived classes may override this calculation with a more accurate
  // one.
  GetEstimatedSizeInBytes(): number {
    return this.GetSize().width() * this.GetSize().height() *
      BytesPerPixel(PixelFormat.kPixelFormatRGBA8);
  }

  // If an ImageParser is able to know that it contains no alpha data (e.g. if it
  // was constructed from ImageData whose alpha format is set to
  // kAlphaFormatOpaque), then this method can return true, and code can
  // be written to take advantage of this and perform optimizations.
  IsOpaque(): boolean { return false; }
  // Mechanism to allow dynamic type checking on ImageParser objects.
  abstract GetTypeId(): TypeId
  EnsureInitialized() {return false;}
  CanRenderInSkia() {return true;}
};
