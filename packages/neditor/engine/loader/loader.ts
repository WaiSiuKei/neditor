import { Fetcher, Handler } from './fetcher';
import { Callback1, Closure } from '@neditor/core/base/callback';
import { Decoder } from './decoder';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK } from '@neditor/core/base/check';
import { IDisposable } from '@neditor/core/base/common/lifecycle';

export type FetcherCreator = Callback1<Fetcher, Handler>

export type OnDestructionFunction = Callback1<void, Loader>;
export type OnCompleteFunction = Callback1<void, Optional<string>>;
export type DecoderCreator = Callback1<Decoder, OnCompleteFunction>;

export class Loader implements IDisposable {
  constructor(
    fetcher_creator: FetcherCreator,
    decoder_creator: DecoderCreator,
    on_load_complete: OnCompleteFunction,
    on_destruction: Optional<OnDestructionFunction> = undefined,
    is_suspended = false
  ) {
    this.fetcher_creator_ = fetcher_creator;
    this.decoder_creator_ = decoder_creator;
    this.on_load_complete_ = on_load_complete;
    this.on_destruction_ = on_destruction;
    this.is_suspended_ = is_suspended;
    DCHECK(this.fetcher_creator_);
    DCHECK(this.decoder_creator_);
    DCHECK(this.on_load_complete_);

    // load_timing_info_ = net::LoadTimingInfo();

    this.decoder_ = this.decoder_creator_(
      this.LoadComplete.bind(this));

    if (!this.is_suspended_) {
      this.Start();
    }
  }

  dispose() {
    if (this.on_destruction_) {
      this.on_destruction_(this);
    }
  }

// Suspends the load of this resource, expecting it to be resumed or destroyed
// later.
// void Suspend();

// Resumes the load of this resource. Suspend must have been previously
// called.
// void Resume(render_tree::ResourceProvider* resource_provider);

// bool DidFailFromTransientError() const;

  LoadComplete(error: Optional<string>) {
    this.is_load_complete_ = true;
    this.on_load_complete_(error);
  }

// net::LoadTimingInfo get_load_timing_info();
// void set_load_timing_info(const net::LoadTimingInfo& timing_info);

// Starts the fetch-and-decode.
  private Start() {
    DCHECK(!this.is_suspended_);

    this.fetcher_handler_to_decoder_adaptor_ = new FetcherHandlerToDecoderAdapter(
      this.decoder_,
      this.LoadComplete.bind(this));
    this.fetcher_ = this.fetcher_creator_(this.fetcher_handler_to_decoder_adaptor_);

    // if (this.fetcher_) {
    // this. fetcher_.SetLoadTimingInfoCallback(base::Bind(&Loader::set_load_timing_info,
    //   base::Unretained(this))
    // }

    // Post the error callback on the current message loop in case the loader is
    // destroyed in the callback.
    if (!this.fetcher_) {
      this.fetcher_creator_error_closure_ = this.LoadComplete.bind(this, 'Fetcher was not created.');
      this.fetcher_creator_error_closure_();
    }
  }

  private fetcher_creator_: FetcherCreator;
  private decoder_creator_: DecoderCreator;

  private decoder_: Decoder;
  private fetcher_handler_to_decoder_adaptor_?: FetcherHandlerToDecoderAdapter;
  private fetcher_?: Fetcher;

  private fetcher_creator_error_closure_?: Closure;

  private on_load_complete_: OnCompleteFunction;
  private on_destruction_: Optional<OnDestructionFunction>;

  private is_suspended_: boolean;
  private is_load_complete_ = false;

// net::LoadTimingInfo load_timing_info_;

}

//////////////////////////////////////////////////////////////////
// Loader::FetcherHandlerToDecoderAdapter
//////////////////////////////////////////////////////////////////

// This class is responsible for passing chunks of data from fetcher to
// decoder and notifying fetching is done or aborted on error.
class FetcherHandlerToDecoderAdapter extends Handler {
  constructor(
    decoder: Decoder,
    load_complete_callback: OnCompleteFunction
  ) {
    super();

    this.decoder_ = decoder;
    this.load_complete_callback_ = load_complete_callback;
  }
// public:
//   FetcherHandlerToDecoderAdapter()
// : decoder_(decoder), load_complete_callback_(load_complete_callback) {}

  // From Fetcher::Handler.
  // LoadResponseType OnResponseStarted(
  //   Fetcher* fetcher,
  // const scoped_refptr<net::HttpResponseHeaders>& headers) override {
  //   if (headers) {
  //     return decoder_.OnResponseStarted(fetcher, headers);
  //   } else {
  //     return kLoadResponseContinue;
  //   }
  // }

  OnReceived(fetcher: Fetcher, data: ArrayBuffer) {
    this.decoder_.DecodeChunk(data);
  }
  // void OnReceivedPassed(Fetcher* fetcher,
  //   std::unique_ptr<std::string> data) override {
  //   decoder_.DecodeChunkPassed(std::move(data));
  // }
  OnDone(fetcher: Fetcher) {
    DCHECK(fetcher);
    // this.decoder_.SetLastURLOrigin(fetcher.last_url_origin());
    this.decoder_.Finish();
  }
  OnError(fetcher: Fetcher, error: string) {
    this.load_complete_callback_(error);
  }

  private decoder_: Decoder;
  private load_complete_callback_: OnCompleteFunction;
};
