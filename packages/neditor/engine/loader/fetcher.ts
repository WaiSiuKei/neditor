export abstract class Handler {
//   public:
//     // The function will be called by supported Fetcher (like NetFetcher) before
//     // any OnReceived() is called so the Handler can preview the response.
//     virtual LoadResponseType OnResponseStarted(
//     Fetcher* fetcher,
//   const scoped_refptr<net::HttpResponseHeaders>& headers)
//   WARN_UNUSED_RESULT {
//   return kLoadResponseContinue;
// }
  abstract OnReceived(fetcher: Fetcher, data: ArrayBuffer): void
  abstract OnDone(fetcher: Fetcher): void
  abstract OnError(fetcher: Fetcher, error: string): void
//
// // By default, |OnReceivedPassed| forwards the std::unique_ptr<std::string>
// // data into |OnReceived|.  Implementations have the opportunity to hold
// // onto the std::unique_ptr through overriding |OnReceivedPassed|.
  OnReceivedPassed(fetcher: Fetcher,
                   data: ArrayBuffer) {
    this.OnReceived(fetcher, data);
  }
//
//
//
// protected:
// Handler() {}
// virtual ~Handler() {}
// base::Callback<void(const net::LoadTimingInfo&)>
// load_timing_info_callback_;
};

export class Fetcher {
  // Concrete Fetcher subclass should start fetching immediately in constructor.
  constructor(handler: Handler) {
    this.handler_ = handler;
  }

  protected handler() { return this.handler_; }

  private handler_: Handler;

}
