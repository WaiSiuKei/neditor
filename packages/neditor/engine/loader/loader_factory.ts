// The LoaderFactory provides a central loader creator object from which clients
// can request the creation of loaders of various types.  The LoaderFactory
// maintains all context necessary to create the various resource types.
import { ResourceProvider } from '../render_tree/resource_provider';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { FetcherCreator, Loader } from './loader';
import { FetcherFactory } from './fetcher_factory';
import { OnCompleteFunction } from './decoder';
import { ImageAvailableCallback } from './image/image_decoder';
import { ImageDecoderProxy } from './image/image_decoder_proxy';
import { FetcherCache } from './fetcher_cache';
import { DCHECK } from '@neditor/core/base/check';
import { TypefaceAvailableCallback, TypefaceDecoder } from './font/typeface_decoder';

type LoaderSet = Set<Loader>

export class LoaderFactory {
  constructor(
    // name: string,
    fetcher_factory: FetcherFactory,
    resource_provider: ResourceProvider,
    // const base::DebuggerHooks& debugger_hooks,
    encoded_image_cache_capacity: number,
    // base::ThreadPriority loader_thread_priority
  ) {
    this.fetcher_factory_ = fetcher_factory;
    this.resource_provider_ = resource_provider;
    if (encoded_image_cache_capacity > 0) {
      this.fetcher_cache_ = new FetcherCache(encoded_image_cache_capacity);
    }
  }

  // Creates a loader that fetches and decodes an image.
  CreateImageLoader(
    url: string,
    // const csp::SecurityCallback& url_security_callback,
    // const image::ImageDecoder::&
    image_available_callback: ImageAvailableCallback,
    load_complete_callback: OnCompleteFunction): Loader {
    let fetcher_creator = this.MakeCachedFetcherCreator(url);

    let loader = new Loader(
      fetcher_creator,
      ImageDecoderProxy.Create.bind(null, this.resource_provider_, image_available_callback),
      load_complete_callback,
      this.OnLoaderDestroyed.bind(this),
      this.is_suspended_);

    this.OnLoaderCreated(loader);
    return loader;
  }

  // Creates a loader that fetches and decodes a link resources.
  // std::unique_ptr<Loader> CreateLinkLoader(
  //     const GURL& url, const Origin& origin,
  //     const csp::SecurityCallback& url_security_callback,
  //     const loader::RequestMode cors_mode,
  //     const TextDecoder::TextAvailableCallback& link_available_callback,
  //     const Loader::OnCompleteFunction& load_complete_callback);

  // Creates a loader that fetches and decodes a Mesh.
  // std::unique_ptr<Loader> CreateMeshLoader(
  //     const GURL& url, const Origin& origin,
  //     const csp::SecurityCallback& url_security_callback,
  //     const mesh::MeshDecoder::MeshAvailableCallback& mesh_available_callback,
  //     const Loader::OnCompleteFunction& load_complete_callback);

  // Creates a loader that fetches and decodes a Javascript resource.
  // std::unique_ptr<Loader> CreateScriptLoader(
  //     const GURL& url, const Origin& origin,
  //     const csp::SecurityCallback& url_security_callback,
  //     const TextDecoder::TextAvailableCallback& script_available_callback,
  //     const Loader::OnCompleteFunction& load_complete_callback);

  // Creates a loader that fetches and decodes a render_tree::Typeface.

  CreateTypefaceLoader(
    url: string,
    // origin: string,
    // const csp::SecurityCallback& url_security_callback,
    // const font::TypefaceDecoder::&
    typeface_available_callback: TypefaceAvailableCallback,
    load_complete_callback: OnCompleteFunction): Loader {
    // DCHECK_CALLED_ON_VALID_THREAD(thread_checker_);

    let fetcher_creator = this.MakeFetcherCreator(url);

    let loader = new Loader(
      fetcher_creator,
      TypefaceDecoder.Create.bind(TypefaceDecoder, this.resource_provider_, typeface_available_callback, load_complete_callback),
      load_complete_callback,
      this.OnLoaderDestroyed.bind(this),
      this.is_suspended_);

    this.OnLoaderCreated(loader);
    return loader;
  }

  // Notify the LoaderFactory that the resource identified by "url" is being
  // requested again.
  NotifyResourceRequested(url: string) {
    if (this.fetcher_cache_) {
      this.fetcher_cache_.NotifyResourceRequested(url);
    }
  }

  // Clears out the loader factory's resource provider, aborting any in-progress
  // loads.
  // Suspend() {
  //   NOTIMPLEMENTED();
  // }
  // Resets a new resource provider for this loader factory to use.  The
  // previous resource provider must have been cleared before this method is
  // called.
  // Resume(resource_provider: ResourceProvider) {
  //   NOTIMPLEMENTED();
  // }

  // Resets a new resource provider for this loader factory to use.  The
  // previous resource provider must have been cleared before this method is
  // called.
  UpdateResourceProvider(resource_provider: ResourceProvider) {
    NOTIMPLEMENTED();
  }

  private OnLoaderCreated(loader: Loader) {
    DCHECK(!this.active_loaders_.has(loader));
    this.active_loaders_.add(loader);
  }
  private OnLoaderDestroyed(loader: Loader) {
    NOTIMPLEMENTED();
  }
  private SuspendActiveLoaders() {
    NOTIMPLEMENTED();
  }
  private ResumeActiveLoaders(resource_provider: ResourceProvider) {
    NOTIMPLEMENTED();
  }

  MakeFetcherCreator(
    url: string
    // const csp::SecurityCallback& url_security_callback,
    // request_mode: RequestMode,
    // const Origin& origin
  ): FetcherCreator {
    return this.fetcher_factory_.CreateSecureFetcher.bind(
      this.fetcher_factory_, url);
  }
  MakeCachedFetcherCreator(
    url: string,
    // const csp::SecurityCallback& url_security_callback,
    // request_mode: RequestMode,
    // const Origin& origin
  ): FetcherCreator {
    let fetcher_creator =
      this.MakeFetcherCreator(url);

    if (this.fetcher_cache_) {
      return this.fetcher_cache_.GetFetcherCreator(url, fetcher_creator);
    }
    return fetcher_creator;
  }

  // Used to create the Fetcher component of the loaders.
  private fetcher_factory_: FetcherFactory;

  // Used to cache the fetched raw data.  Note that currently the cache is only
  // used to cache ImageParser data.  We may introduce more caches once we want to
  // cache fetched data for other resource types.
  private fetcher_cache_?: FetcherCache;

  // Used to create render_tree resources.
  private resource_provider_: ResourceProvider;

  // Used with CLOG to report errors with the image source.
  // const base::DebuggerHooks& debugger_hooks_;

  // Keeps track of all active loaders so that if a suspend event occurs they
  // can be aborted.

  private active_loaders_: LoaderSet = new Set<Loader>();

  // Thread to run asynchronous fetchers and decoders on.  At the moment,
  // image decoding is the only thing done on this thread.
  // base::Thread load_thread_;

  // Whether or not the LoaderFactory is currently suspended. While it is, all
  // loaders created by it begin in a suspended state.
  private is_suspended_: boolean = false;
};
