import { Fetcher, Handler } from './fetcher';
import { INFO, LOG } from '@neditor/core/base/logging';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { NetFetcher } from './net_fetcher';

export class FetcherFactory {
// public:
//  explicit FetcherFactory(network::NetworkModule* network_module);
//  FetcherFactory(network::NetworkModule* network_module,
//                 const base::FilePath& extra_search_dir);
//  FetcherFactory(
//      network::NetworkModule* network_module,
//      const base::FilePath& extra_search_dir,
//      const BlobFetcher::ResolverCallback& blob_resolver,
//      const base::Callback<int(const std::string&,
//                               std::unique_ptr<char[]>*)>& read_cache_callback =
//          base::Callback<int(const std::string&, std::unique_ptr<char[]>*)>());
//
//  // Creates a fetcher. Returns NULL if the creation fails.
//  std::unique_ptr<Fetcher> CreateFetcher(const GURL& url,
//                                         Fetcher::Handler* handler);
//
  CreateSecureFetcher(
    url: string,
    // const csp::SecurityCallback& url_security_callback,
    //    RequestMode request_mode, const Origin& origin,
    handler: Handler): Fetcher {
    LOG(INFO, 'Fetching: ', url.substr(0, 200));

    // if (!url.is_valid()) {
    //   std::stringstream error_message;
    //   error_message << "URL is invalid: " << url;
    //   return std::unique_ptr<Fetcher>(
    //     new ErrorFetcher(handler, error_message.str()));
    // }

    // if ((url.SchemeIs('https') || url.SchemeIs('http') || url.SchemeIs('data')) && network_module_) {
    //   NetFetcher::Options;options;
    return new NetFetcher(url, handler);
    // }

    // if (url.SchemeIs("blob") && !blob_resolver_.is_null()) {
    //   return std::unique_ptr<Fetcher>(
    //     new BlobFetcher(url, handler, blob_resolver_));
    // }

    // if (url.SchemeIs(kEmbeddedScheme)) {
    //   EmbeddedFetcher::Options options;
    //   return std::unique_ptr<Fetcher>(
    //     new EmbeddedFetcher(url, url_security_callback, handler, options));
    // }

    // if (url.SchemeIsFile()) {
    //   base::FilePath file_path;
    //   if (!FileURLToFilePath(url, &file_path)) {
    //     std::stringstream error_message;
    //     error_message << "File URL cannot be converted to file path: " << url;
    //     return std::unique_ptr<Fetcher>(
    //       new ErrorFetcher(handler, error_message.str()));
    //   }
    //
    //   FileFetcher::Options options;
    //   options.message_loop_proxy = file_thread_.task_runner();
    //   options.extra_search_dir = extra_search_dir_;
    //   return std::unique_ptr<Fetcher>(
    //     new FileFetcher(file_path, handler, options));
    // }

    // #if defined(ENABLE_ABOUT_SCHEME)
    // if (url.SchemeIs(kAboutScheme)) {
    //   return std::unique_ptr<Fetcher>(new AboutFetcher(handler));
    // }
    // #endif

    // NOTREACHED();
    // let error_message = `Scheme ${url}: is not supported"`;
    // return new ErrorFetcher(handler, error_message);
  }
//
//  network::NetworkModule* network_module() const { return network_module_; }
//
// private:
//  base::Thread file_thread_;
//  network::NetworkModule* network_module_;
//  base::FilePath extra_search_dir_;
//  BlobFetcher::ResolverCallback blob_resolver_;
//  base::Callback<int(const std::string&, std::unique_ptr<char[]>*)>
//      read_cache_callback_;
};
