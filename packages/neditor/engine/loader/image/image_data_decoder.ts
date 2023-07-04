import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Image } from './image';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { PixelFormat, ImageData, AlphaFormat } from '../../render_tree/image';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK } from '@neditor/core/base/check';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Size } from '../../math/size';
// Sanity check max size of data buffer.
const kMaxBufferSizeBytes = 4 * 1024 * 1024;

export enum State {
  kWaitingForHeader,
  kReadLines,
  kDone,
  kError,
};

// This class is used as a component of ImageDecoder and is intended to be
// sub-classed by specific data decoders, such as JPEG decoders and PNG
// decoders. This class is intended to decode image data based on the type,
// but leaves the responsibility of handling callbacks and producing the final
// image to ImageDecoder.
export abstract class ImageDataDecoder {
  constructor(resource_provider: ResourceProvider) {
    this.resource_provider_ = resource_provider;
    this.state_ = State.kWaitingForHeader;
    this.CalculatePixelFormat();
  }

  // virtual ~ImageDataDecoder() {}

  abstract GetTypeString(): string

  DecodeChunk(data: ArrayBuffer) {
    TRACE_EVENT0('cobalt::loader::image_decoder',
      'ImageDataDecoder::DecodeChunk');
    this.DecodeChunkInternal(data);
    // while (offset < size) {
    //   if (this.state_ == State. kError) {
    //     // Previous chunk causes an error, so there is nothing to do in here.
    //     return;
    //   }
    //
    //   let input_bytes: Uint8Array;
    //  let  input_size: number
    //
    //   if (this.data_buffer_.length===0) {
    //     // Nothing in |data_buffer_|, so no data append needs to be performed.
    //     input_size = size - offset;
    //     input_bytes = data.slice(offset, )  data + offset;
    //
    //     offset += input_size;
    //   } else {
    //     DCHECK_GE(kMaxBufferSizeBytes, data_buffer_.size());
    //     let  fill_buffer_size =
    //       std::min(kMaxBufferSizeBytes - data_buffer_.size(), size - offset);
    //
    //     // Append new data to data_buffer
    //     data_buffer_.insert(data_buffer_.end(), data + offset,
    //       data + offset + fill_buffer_size);
    //
    //     input_bytes = &data_buffer_[0];
    //     input_size = data_buffer_.size();
    //     offset += fill_buffer_size;
    //   }
    //
    //   size_t decoded_size = DecodeChunkInternal(input_bytes, input_size);
    //   if (decoded_size == 0 && offset < size) {
    //     LOG(ERROR) << "Unable to make progress decoding image.";
    //     state_ = kError;
    //     return;
    //   }
    //
    //   size_t undecoded_size = input_size - decoded_size;
    //   if (undecoded_size == 0) {
    //     // Remove all elements from the data_buffer.
    //     data_buffer_.clear();
    //   } else {
    //     if (data_buffer_.empty()) {
    //       if (undecoded_size > kMaxBufferSizeBytes) {
    //         LOG(ERROR) << "Max buffer size too small: " << undecoded_size
    //         << "bytes required!";
    //         state_ = kError;
    //         return;
    //       }
    //
    //       // |data_buffer_| is empty, so assign the undecoded data to it.
    //       data_buffer_.reserve(undecoded_size);
    //       data_buffer_.assign(data + offset - undecoded_size, data + offset);
    //     } else if (decoded_size != 0) {
    //       // |data_buffer_| is not empty, so erase the decoded data from it.
    //       data_buffer_.erase(
    //         data_buffer_.begin(),
    //         data_buffer_.begin() + static_cast<ptrdiff_t>(decoded_size));
    //     }
    //   }
    // }
  }
  FinishAndMaybeReturnImage(): Optional<Image> {
    TRACE_EVENT0('cobalt::loader::image_decoder',
      'ImageDataDecoder::FinishAndMaybeReturnImage');

    return this.FinishInternal();
  }

  // Every subclass of ImageDataDecoder should override this function to do
  // the internal decoding. The return value of this function is the number of
  // decoded data.
  protected abstract DecodeChunkInternal(data: ArrayBuffer): void
  // Subclass has to override to finalize the decoding and return decoded image.
  protected abstract FinishInternal(): Optional<Image>

  protected resource_provider(): ResourceProvider {
    return this.resource_provider_;
  }

  // const base::DebuggerHooks& debugger_hooks() { return debugger_hooks_; }

  protected set_state(state: State) { this.state_ = state; }
  protected state(): State { return this.state_; }

  protected pixel_format(): PixelFormat { return this.pixel_format_!; }

  // Helper functions used by derived classes to create image and various
  // objects to hold decoded image data.
  protected AllocateImageData(
    size: Size, has_alpha: boolean): ImageData {
    DCHECK(this.resource_provider_.AlphaFormatSupported(
      AlphaFormat.kAlphaFormatOpaque));
    DCHECK(this.resource_provider_.AlphaFormatSupported(
      AlphaFormat.kAlphaFormatPremultiplied));
    let image_data = this.resource_provider_.AllocateImageData(
      size, this.pixel_format(),
      has_alpha ? AlphaFormat.kAlphaFormatPremultiplied
        : AlphaFormat.kAlphaFormatOpaque);
    DCHECK(image_data);
    return image_data;
  }
  protected CreateImage(image_data: ImageData): Image {
    DCHECK(image_data);
    return this.resource_provider().CreateImage(image_data);
  }

  // Called on construction to query the ResourceProvider for the best image
  // pixel format to use.
  private CalculatePixelFormat() {
    this.pixel_format_ = PixelFormat.kPixelFormatRGBA8;
    if (!this.resource_provider_.PixelFormatSupported(this.pixel_format_)) {
      this.pixel_format_ = PixelFormat.kPixelFormatBGRA8;
    }

    DCHECK(this.resource_provider_.PixelFormatSupported(this.pixel_format_));
  }

  // |resource_provider_| is used to allocate render_tree::ImageData
  private resource_provider_: ResourceProvider;
  // |debugger_hooks_| is used with CLOG to report errors to the WebDev.
  // const base::DebuggerHooks& debugger_hooks_;
  // |data_buffer_| is used to cache the undecoded data.
  // private data_buffer_: Uint8Array = new Uint8Array();
  // Record the current decoding status.
  private state_: State;
  // The pixel format that the decoded image data is expected to be in.
  private pixel_format_?: PixelFormat;
};
