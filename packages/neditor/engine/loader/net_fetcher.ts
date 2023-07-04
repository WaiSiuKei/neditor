// NetFetcher is for fetching data from the network.
import { Fetcher, Handler } from './fetcher';
// @ts-ignore
import img from './354.jpg';

export class NetFetcher extends Fetcher {
  constructor(
    url: string,
    handler: Handler
  ) {
    super(handler);
    this.Start();
    fetch(img).then((resp: Response) => resp.arrayBuffer()).then((buf: ArrayBuffer) => {
      let data = buf;
      this.handler().OnReceivedPassed(this, data);

      this.handler().OnDone(this);
    });
    // this.OnURLFetchComplete();
  }

  private Start() {
    // const GURL& original_url = url_fetcher_.GetOriginalURL();
    //   security_callback_.Run(original_url, false /* did not redirect */)) {
    //   url_fetcher_.Start();
  }

  // private OnURLFetchComplete() {
  //   let data = '';
  //   this.handler().OnReceivedPassed(this, data);
  //
  //   this.handler().OnDone(this);
  // }
};
