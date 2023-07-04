import { Callback1 } from '@neditor/core/base/callback';
import { Optional } from '@neditor/core/base/common/typescript';

export type OnCompleteFunction = Callback1<void, Optional<string>>

export abstract class Decoder {
  Decoder() {}
  // virtual ~Decoder() {}

  // A loader may want to signal the beginning of a decode and can send
  // the HTTP headers, if this was a network request.
//   LoadResponseType OnResponseStarted(
//       fetcher:  Fetcher,
// ) {
//     return  LoadResponseType. kLoadResponseContinue;
//   }

  // This is the interface that chunks of bytes can be sent in to be decoded.
  abstract DecodeChunk(data: ArrayBuffer): void

  // A decoder can choose to implement |DecodeChunkPassed| in order to take
  // ownership of the chunk data.  Taking ownership over the chunk data can
  // allow data copies to be avoided, such as when passing the data off to be
  // decoded asynchronously.  Not all fetchers are guaranteed to support this
  // though, in which case they simply forward the scoped pointer data to
  // DecodeChunk.
  // abstract DecodeChunkPassed( data: string) {
  //   DecodeChunk(data->data(), data->size());
  // }

  // This is called when all data are sent in and decoding should be finalized.
  abstract Finish(): void

  // Suspends the decode of this resource, resetting internal state. Returns
  // whether the decoder was reset correctly. If not, the load will have to be
  // aborted.
  // abstract Suspend(): void

  // Resumes the decode of this resource, starting over from the zero state.
  // abstract Resume(resource_provider: ResourceProvider): void

  // Provides textdecoder with last url to prevent security leak if resource is
  // cross-origin.
  // abstract SetLastURLOrigin(const Origin&) {}
}
