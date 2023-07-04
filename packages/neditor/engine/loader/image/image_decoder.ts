// The various types of images we support decoding.
import { Image } from './image';
import { Callback, Callback1 } from '@neditor/core/base/callback';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { Decoder, OnCompleteFunction } from '../decoder';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { ImageDataDecoder } from './image_data_decoder';
import { Optional } from '@neditor/core/base/common/typescript';
import { getFunctionName, TRACE_EVENT0, TRACE_EVENT1 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { DCHECK } from '@neditor/core/base/check';
import { memcmpWithNums, memcmpWithString, memcpy } from '@neditor/core/base/common/arraybuffer';
import { JPEGImageDecoder } from './jpeg_image_decoder';

export enum ImageType {
  kImageTypeInvalid,
  kImageTypeGIF,
  kImageTypeJPEG,
  kImageTypeJSON,
  kImageTypePNG,
  kImageTypeWebP,
}

enum State {
  kWaitingForHeader,
  kDecoding,
  kNotApplicable,
  kUnsupportedImageFormat,
  kSuspended,
}

class SignatureCache {
  data = new Uint8Array(kLengthOfLongestSignature);
  position = 0;
};
// The current longest signature is WEBP signature.
const kLengthOfLongestSignature = 14;

export type ImageAvailableCallback = Callback1<void, Image>;
// This class handles decoding any image. If image type is not given, it is
// determined by the signature in the data. Then an image data decoder specific
// to that image type is created to parse the data. When the decoding is
// complete, the image decoder retrieves the data and uses it to create the
// image.
export class ImageDecoder extends Decoder {
  constructor(
    resource_provider: ResourceProvider,
    image_available_callback: ImageAvailableCallback,
    load_complete_callback: OnCompleteFunction,
    image_type: Optional<ImageType> = undefined
  ) {
    super();
    this.resource_provider_ = resource_provider;
    this.image_available_callback_ = image_available_callback;
    this.image_type_ = image_type || ImageType.kImageTypeInvalid;
    this.load_complete_callback_ = load_complete_callback;
    this.state_ = this.resource_provider_ ? State.kWaitingForHeader : State.kSuspended;
    this.signature_cache_.position = 0;
  }

  // From Decoder.
  // OnResponseStarted(
  //   fetcher: Fetcher): LoadResponseType {
  //   NOTIMPLEMENTED();
  //
  // }
  DecodeChunk(data: ArrayBuffer) {
    TRACE_EVENT1('cobalt::loader::image_decoder', 'ImageDecoder::DecodeChunk',
      'size', data.byteLength.toString());

    if (data.byteLength == 0) {
      DLOG(WARNING, 'Decoder received 0 bytes.');
      return;
    }

    this.DecodeChunkInternal(data);
  }
  Finish() {
    TRACE_EVENT0('cobalt::loader::image_decoder', 'ImageDecoder::Finish');
    // // If there's a deletion pending, then just clear out the decoder and return.
    // // There's no point in doing any additional processing that'll get thrown
    // // away without ever being used.
    // if (base::subtle::Acquire_Load(&is_deletion_pending_)) {
    //   decoder_.reset();
    //   return;
    // }

    const { state_, signature_cache_, load_complete_callback_, error_message_ } = this;
    let decoder_ = this.decoder_!;
    switch (state_) {
      case State.kDecoding:
        DCHECK(decoder_);
        let image = decoder_.FinishAndMaybeReturnImage();
        if (image) {
          this.image_available_callback_(image);
          this.load_complete_callback_(undefined);
        } else {
          this.load_complete_callback_(decoder_.GetTypeString() +
            ' failed to decode image.');
        }
        break;
      case State.kWaitingForHeader:
        if (signature_cache_.position == 0) {
          // no image is available.
          load_complete_callback_(error_message_);
        } else {
          load_complete_callback_('No enough image data for header.');
        }
        break;
      case State.kUnsupportedImageFormat:
        load_complete_callback_(('Unsupported image format.'));
        break;
      case State.kSuspended:
        DLOG(WARNING, getFunctionName(ImageDecoder, ImageDecoder.prototype.Finish), '[', this, '] while suspended.');
        break;
      case State.kNotApplicable:
        // no image is available.
        load_complete_callback_(error_message_);
        break;
    }
  }
  // Suspend(): boolean {
  //   NOTIMPLEMENTED();
  // }
  // Resume(resource_provider: ResourceProvider) {
  //   NOTIMPLEMENTED();
  //
  // }

  // // Called when this ImageDecoder's deletion has been posted to a message loop.
  // // This prevents any additional decoding from occurring prior to the decoder
  // // being deleted.
  // SetDeletionPending() {
  //   NOTIMPLEMENTED();
  // }

  // // Call this function to use the StubImageDecoder which produces a small image
  // // without decoding.
  // static UseStubImageDecoder() {
  //   NOTIMPLEMENTED();
  //
  // }
  // Returns true if the platform allows decoding and storing decoded images
  // into multi-plane.
  static AllowDecodingToMultiPlane(): boolean {
    return false;
  }

  private DecodeChunkInternal(input_bytes: ArrayBuffer) {
    TRACE_EVENT0('cobalt::loader::image', 'ImageDecoder::DecodeChunkInternal()');
    switch (this.state_) {
      case State.kWaitingForHeader: {
        let { consumed_size, result } = this.InitializeInternalDecoder(input_bytes);
        if (result) {
          this.state_ = State.kDecoding;
          DCHECK(this.decoder_);
          if (consumed_size == kLengthOfLongestSignature) {
            // This case means the first chunk is large enough for matching
            // signature.
            this.decoder_!.DecodeChunk(input_bytes);
          } else {
            NOTIMPLEMENTED();
            // decoder_.DecodeChunk(signature_cache_.data,
            //   kLengthOfLongestSignature);
            // input_bytes += consumed_size;
            // decoder_->DecodeChunk(input_bytes, size - consumed_size);
          }
        } else {
          NOTIMPLEMENTED();
        }
      }
        break;
      case State.kDecoding: {
        DCHECK(this.decoder_);
        this.decoder_!.DecodeChunk(input_bytes);
      }
        break;
      case State.kNotApplicable:
      case  State.kUnsupportedImageFormat:
      case  State.kSuspended: {
        // Do not attempt to continue processing data.
        DCHECK(!this.decoder_);
      }
        break;
    }
  }
  private InitializeInternalDecoder(input_bytes: ArrayBuffer
  ): { result: boolean, consumed_size: number } {
    TRACE_EVENT0('cobalt::loader::image',
      'ImageDecoder::InitializeInternalDecoder()');
    let index = this.signature_cache_.position;
    if (index !== 0) debugger
    let size = input_bytes.byteLength;
    let fill_size = Math.min(kLengthOfLongestSignature - index, size);
    memcpy(this.signature_cache_.data, new Uint8Array(input_bytes), index, fill_size);
    this.signature_cache_.position += fill_size;
    let consumed_size = fill_size;
    if (this.signature_cache_.position < kLengthOfLongestSignature) {
      // Data is not enough for matching signature.
      return {
        result: false,
        consumed_size,
      };
    }

    if (this.image_type_ == ImageType.kImageTypeInvalid) {
      this.image_type_ = DetermineImageType(this.signature_cache_.data);
    }

    // this.decoder_ = MaybeCreateStarboardDecoder(this.mime_type_, this.image_type_,
    //   this.resource_provider_);

    if (!this.decoder_) {
      this.decoder_ = CreateImageDecoderFromImageType(this.image_type_, this.resource_provider_);
    }

    if (!this.decoder_) {
      this.state_ = State.kUnsupportedImageFormat;
      return {
        result: false,
        consumed_size,
      };
    }

    return {
      result: true,
      consumed_size,
    };
  }

  private resource_provider_: ResourceProvider;
  // private const base::DebuggerHooks& debugger_hooks_;
  private image_available_callback_: ImageAvailableCallback;
  private image_type_: ImageType;
  private load_complete_callback_: OnCompleteFunction;
  private decoder_?: ImageDataDecoder;
  private signature_cache_: SignatureCache = new SignatureCache();
  private state_: State;
  private error_message_?: string;
  // private mime_type_?: string;

  // Whether or not we use failure image decoder.
  private use_failure_image_decoder_ = false;
}

// Determine the ImageType of an image from its signature.
function DetermineImageType(header: Uint8Array): ImageType {
  let arr = new Uint8Array(header);
  if (memcmpWithNums(header, [0xFF, 0xD8, 0xFF])) {
    return ImageType.kImageTypeJPEG;
  } else if (!memcmpWithString(header, 'GIF87a') || !memcmpWithString(header, 'GIF89a')) {
    return ImageType.kImageTypeGIF;
  } else if (!memcmpWithNums(header, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
    return ImageType.kImageTypePNG;
  } else if (!memcmpWithString(header, 'RIFF',) && !memcmpWithString(header, 'WEBPVP', 8)) {
    return ImageType.kImageTypeWebP;
  } else {
    return ImageType.kImageTypeInvalid;
  }
}

function CreateImageDecoderFromImageType(
  image_type: ImageType,
  resource_provider: ResourceProvider,
  // const base::DebuggerHooks& debugger_hooks,
): ImageDataDecoder {
  // Call different types of decoders by matching the image signature.
  // if (s_use_stub_image_decoder) {
  //   return std::unique_ptr<ImageDataDecoder>(
  //     new StubImageDecoder(resource_provider, debugger_hooks));
  // } else if (use_failure_image_decoder) {
  //   return std::unique_ptr<ImageDataDecoder>(
  //     new FailureImageDecoder(resource_provider, debugger_hooks));
  // } else
  if (image_type == ImageType.kImageTypeJPEG) {
    return new JPEGImageDecoder(resource_provider, ImageDecoder.AllowDecodingToMultiPlane());
  }
  NOTREACHED();
  // if (image_type == ImageType.kImageTypePNG) {
  //   return new PNGImageDecoder(resource_provider);
  // }
  // if (image_type == ImageType.kImageTypeWebP) {
  //   return new WEBPImageDecoder(resource_provider);
  // }
  // if (image_type == ImageType.kImageTypeGIF) {
  //   return new DummyGIFImageDecoder(resource_provider);
  // }
  // if (image_type == ImageType.kImageTypeJSON) {
  //   return new LottieAnimationDecoder(resource_provider);
  // }
}
