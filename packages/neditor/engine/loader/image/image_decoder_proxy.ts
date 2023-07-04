import { Image } from './image';
import { Callback, Callback1 } from '@neditor/core/base/callback';
import { Decoder, OnCompleteFunction } from '../decoder';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { ImageDecoder } from './image_decoder';

type ImageAvailableCallback = Callback1<void, Image>

// This class handles the layer of indirection between images that web module
// thread wants to decode, and the ResourceLoader thread that does the actual
// work.
export class ImageDecoderProxy extends Decoder {
  // This function is used for binding a callback to create a
  // ThreadedImageDecoderProxy.
  static Create(
    resource_provider: ResourceProvider,
    // const base::DebuggerHooks* debugger_hooks,
    image_available_callback: ImageAvailableCallback,
    // base::MessageLoop* load_message_loop_,
    load_complete_callback: OnCompleteFunction) {
    return (new ImageDecoderProxy(
      resource_provider,
      // debugger_hooks,
      image_available_callback,
      // load_message_loop_,
      load_complete_callback));
  }
  // From the Decoder interface.
  DecodeChunk(data: ArrayBuffer): void {
    this.image_decoder_.DecodeChunk(data);
  }
  Finish(): void {
    this.image_decoder_.Finish();
  }

  constructor(
    resource_provider: ResourceProvider,
    //      const base::DebuggerHooks* debugger_hooks,
    image_available_callback: ImageAvailableCallback,
    //      base::MessageLoop* load_message_loop_,
    load_complete_callback: OnCompleteFunction
  ) {
    super();
    this.image_decoder_ = (new ImageDecoder(
      resource_provider,
      image_available_callback.bind(this),
      load_complete_callback.bind(this)));
  }
  //
  //  base::WeakPtrFactory<ThreadedImageDecoderProxy> weak_ptr_factory_;
  //  base::WeakPtr<ThreadedImageDecoderProxy> weak_this_;
  //
  //
  //  // The actual image decoder.
  private image_decoder_: ImageDecoder;
}
