import { Typeface } from '../../render_tree/typeface';
import { Decoder, OnCompleteFunction } from '../decoder';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { DCHECK } from '@neditor/core/base/check';
import { Callback1 } from '@neditor/core/base/callback';

export type  TypefaceAvailableCallback = Callback1<void, Typeface>;

// |TypefaceDecoder| handles collecting typeface data, which it provides to its
// |ResourceProvider|, which is responsible for interpreting the data and
// generating the typeface.
export class TypefaceDecoder extends Decoder {
  // This function is used for binding a callback to create a TypefaceDecoder.
  static Create(
    resource_provider: ResourceProvider,
    typeface_available_callback: TypefaceAvailableCallback,
    load_complete_callback: OnCompleteFunction): Decoder {
    return new TypefaceDecoder(resource_provider, typeface_available_callback,
      load_complete_callback);
  }
  resource_provider_: ResourceProvider;
  typeface_available_callback_: TypefaceAvailableCallback;
  load_complete_callback_: OnCompleteFunction;

  // std::unique_ptr<render_tree::ResourceProvider::RawTypefaceDataVector>
  // raw_data_;
  is_raw_data_too_large_: boolean;
  is_suspended_: boolean;

  constructor(
    resource_provider: ResourceProvider,
    typeface_available_callback: TypefaceAvailableCallback,
    load_complete_callback: OnCompleteFunction) {
    super();
    this.resource_provider_ = (resource_provider);
    this.typeface_available_callback_ = (typeface_available_callback);
    this.load_complete_callback_ = (load_complete_callback);
    this.is_raw_data_too_large_ = false;
    this.is_suspended_ = (!this.resource_provider_);
    DCHECK(!!this.typeface_available_callback_);
    DCHECK(!!load_complete_callback);
  }

  DecodeChunk(data: ArrayBuffer): void {
  }
  Finish(): void {
  }
}
