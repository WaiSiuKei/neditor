// Inhibit C++ name-mangling for libjpeg functions.
import { ImageDataDecoder, State } from './image_data_decoder';
import { ImageData, RawImageMemory } from '../../render_tree/image';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Image } from './image';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK } from '@neditor/core/base/check';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import jpeg from 'jpeg-js';
import { Size } from '../../math/size';
import { memcpy } from '@neditor/core/base/common/arraybuffer';

export enum OutputFormat {
  kOutputFormatInvalid,
  kOutputFormatYUV,
  kOutputFormatRGBA,
  kOutputFormatBGRA,
};

export class JPEGImageDecoder extends ImageDataDecoder {
  // ~JPEGImageDecoder() override;

  // From ImageDataDecoder
  GetTypeString() { return 'JPEGImageDecoder'; }

  // private:

  // From ImageDataDecoder
  // size_t DecodeChunkInternal(const uint8* data, size_t size) override;
  // scoped_refptr<ImageParser> FinishInternal() override;

  // bool ReadHeader();
  // bool StartDecompress();
  // bool DecodeProgressiveJPEG();
  // bool ReadYUVLines();
  // bool ReadRgbaOrGbraLines();
  // bool ReadLines();

  // const bool allow_image_decoding_to_multi_plane_;

  // jpeg_decompress_struct info_;
  // jpeg_source_mgr source_manager_;
  // jpeg_error_mgr error_manager_;

  private output_format_: OutputFormat = OutputFormat.kOutputFormatInvalid;

  // This is only used when |output_format_| is kOutputFormatRGBA or
  // kOutputFormatBGRA.
  private decoded_image_data_?: ImageData;

  // All the following variables are only valid when |output_format_| is
  // kOutputFormatYUV.
  private raw_image_memory_?: RawImageMemory;

  // Sample factors of y plane, they are 1 for yuv444 or 2 for yuv420 but may
  // have other value combinations for other yuv formats.
  // int h_sample_factor_ = 0;
  // int v_sample_factor_ = 0;
  // Width/height of y plane, aligned to |kDctScaleSize| * |y_sample_factor_|.
  // JDIMENSION y_plane_width_ = 0;
  // JDIMENSION y_plane_height_ = 0;

  // Pass true to |allow_image_decoding_to_multi_plane| to allow the decoder to
  // produce output in YUV  whenever possible, which saves both decoding time
  // and memory footprint.  Pass false to it on platforms that cannot render
  // multi plane images efficiently, and the output will always be produced in
  // single plane RGBA or BGRA.
  constructor(
    resource_provider: ResourceProvider,
    allow_image_decoding_to_multi_plane: boolean,
  ) {
    super(resource_provider);
    TRACE_EVENT0('cobalt::loader::image', 'JPEGImageDecoder::JPEGImageDecoder()');
  }
  protected DecodeChunkInternal(input: ArrayBuffer): void {
    TRACE_EVENT0('cobalt::loader::image',
      'JPEGImageDecoder::DecodeChunkInternal()');
    var { width, height, data } = jpeg.decode(input, { useTArray: true });
    this.decoded_image_data_ =
      this.AllocateImageData(new Size(width, height), false);
    this.decoded_image_data_!.SetMemory(new Uint8Array(input))
    this.output_format_ = OutputFormat.kOutputFormatRGBA;
    this.set_state(State.kDone);
  }
  protected FinishInternal(): Optional<Image> {
    if (this.state() != State.kDone) {
      this.decoded_image_data_ = undefined;
      this.raw_image_memory_ = undefined;
      return undefined;
    }
    DCHECK(this.output_format_ != OutputFormat.kOutputFormatInvalid);

    if (this.output_format_ == OutputFormat.kOutputFormatRGBA ||
      this.output_format_ == OutputFormat.kOutputFormatBGRA) {
      DCHECK(this.decoded_image_data_);
      return this.CreateImage(this.decoded_image_data_!);
    }
    NOTIMPLEMENTED();
  }
};
