import { ViewportSize } from '../cssom/viewport_size';
import { Node } from '../render_tree/node';
import { Window } from '../dom/window';
import { GetSystemLanguageScript } from '../base/language';
import { LayoutManager } from '../layout/layout_manager';
import { LayoutResults } from '../layout/layout_manager';
import { TimeTicks } from '@neditor/core/base/time/time';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { DCHECK } from '@neditor/core/base/check';
import { ResourceProvider } from '../render_tree/resource_provider';
import { runWhenIdle } from '@neditor/core/base/common/async';
import { DCHECK_LE } from '@neditor/core/base/check_op';
import { CreateImageCache, ImageCache } from '../loader/image/image_cache';
import { LoaderFactory } from '../loader/loader_factory';
import { FetcherFactory } from '../loader/fetcher_factory';
import { CreateRemoteTypefaceCache, RemoteTypefaceCache } from '../loader/font/remote_typeface_cache';
import { Document } from "../dom/document";

export interface WebModuleOptions {
  // The name of the WebModule.  This is useful for debugging purposes as in
  // the case where multiple WebModule objects exist, it can be used to
  // differentiate which objects belong to which WebModule.  It is used
  // to name some CVals.
  name: string;
  // If true, the initial containing block's background color will be applied
  // as a clear, i.e. with blending disabled.  This means that a background
  // color of transparent will replace existing pixel values, effectively
  // clearing the screen.
  clear_window_with_background_color: boolean;
  // Encoded image cache capacity in bytes.
  encoded_image_cache_capacity: number;

  // ImageParser cache capacity in bytes.
  image_cache_capacity: number;
  remote_typeface_cache_capacity: number
}

const DefaultWebModuleOptions: Partial<WebModuleOptions> = {
  name: '',
  clear_window_with_background_color: true,
  // encoded_image_cache_capacity: 1024 * 1024,
  encoded_image_cache_capacity: 0,
  image_cache_capacity: 32 * 1024 * 1024,
  remote_typeface_cache_capacity: 4 * 1024 * 1024,
};

export type OnRenderTreeProducedCallback = (res: LayoutResults) => void

export const kDOMMaxElementDepth = 512;

export class WebModule {
  name_: string;
  is_running_: boolean;

  window_: Window;
  resource_provider_: ResourceProvider;
  public layoutManager: LayoutManager;
  render_tree_produced_callback_: OnRenderTreeProducedCallback;
  last_render_tree_produced_time_: TimeTicks | null = null;
  is_render_tree_rasterization_pending_: boolean = false;

  // FetcherFactory that is used to create a fetcher according to URL.
  private fetcher_factory_: FetcherFactory;
  // LoaderFactory that is used to acquire references to resources from a
  // URL.
  private loader_factory_: LoaderFactory;
  // ImageCache that is used to manage image cache logic.
  private image_cache_: ImageCache;
  // RemoteTypefaceCache that is used to manage loading and caching typefaces
  // from URLs.
  private remote_typeface_cache_: RemoteTypefaceCache;
  constructor(
    render_tree_produced_callback: OnRenderTreeProducedCallback,
    window_dimensions: ViewportSize,
    resource_provider: ResourceProvider,
    options: Partial<WebModuleOptions>,
  ) {
    let opt = { ...options, ...DefaultWebModuleOptions } as WebModuleOptions;
    this.name_ = opt.name;
    this.is_running_ = true;
    this.resource_provider_ = resource_provider;

    this.fetcher_factory_ = new FetcherFactory(
      // data.network_module, data.options.extra_web_file_dir,
      // dom::URL::MakeBlobResolverCallback(blob_registry_.get()),
      // read_cache_callback
    );
    DCHECK(this.fetcher_factory_);

    DCHECK_LE(0, opt.encoded_image_cache_capacity);
    this.loader_factory_ = new LoaderFactory(
      // name_.c_str(),
      this.fetcher_factory_,
      this.resource_provider_,
      // debugger_hooks_,
      opt.encoded_image_cache_capacity,
      // data.options.loader_thread_priority
    );
    DCHECK_LE(0, opt.image_cache_capacity);
    this.image_cache_ = CreateImageCache(
      `${this.name_}.ImageCache`,
      // base::StringPrintf("%s.ImageCache", name_.c_str()), debugger_hooks_,
      opt.image_cache_capacity,
      this.loader_factory_);
    DCHECK(this.image_cache_);

    this.remote_typeface_cache_ = CreateRemoteTypefaceCache(
      `${this.name_}.RemoteTypefaceCache`,
      // debugger_hooks_,
      opt.remote_typeface_cache_capacity,
      this.loader_factory_);

    this.window_ = new Window(
      window_dimensions,
      resource_provider,
      this.image_cache_,
      this.remote_typeface_cache_,
      GetSystemLanguageScript(),
      kDOMMaxElementDepth
    );
    this.render_tree_produced_callback_ = render_tree_produced_callback;
    let is_concealed = false;
    this.layoutManager = new LayoutManager(
      is_concealed,
      this.name_,
      this.window_,
      this.OnRenderTreeProduced.bind(this),
      this.onLayout.bind(this),
      // data.options.layout_trigger,
      kDOMMaxElementDepth,
      60,
      'en-US',
      // data.options.enable_image_animations,
      // web_module_stat_tracker_->layout_stat_tracker(),
      opt.clear_window_with_background_color);
  }

  get document(): Document {
    return this.window_.document()
  }

  SetApplicationStartOrPreloadTimestamp(is_preload: boolean, timestamp: number) {
    DCHECK(this.window_);
    this.window_.performance().SetApplicationStartOrPreloadTimestamp(is_preload, timestamp);
  }

  DoSynchronousLayout(): void {
    this.window_.document().DoSynchronousLayout();
  }
  DoSynchronousLayoutAndGetRenderTree(): Node | null {
    TRACE_EVENT0('cobalt::browser',
      'WebModule::Impl::DoSynchronousLayoutAndGetRenderTree()');
    return this.window_.document().DoSynchronousLayoutAndGetRenderTree();
  }

  OnRenderTreeProduced(layout_results: LayoutResults) {
    DCHECK(this.is_running_);

    this.last_render_tree_produced_time_ = TimeTicks.Now();
    this.is_render_tree_rasterization_pending_ = true;

    // web_module_stat_tracker_->OnRenderTreeProduced(
    //   last_render_tree_produced_time_);

    let layout_results_with_callback = new LayoutResults(
      layout_results.render_tree,
      layout_results.layout_time,
      this.OnRenderTreeRasterized.bind(this, this.last_render_tree_produced_time_),
    );

    this.render_tree_produced_callback_(layout_results_with_callback);
  }

  OnRenderTreeRasterized(produced_time: TimeTicks) {
    runWhenIdle(this.ProcessOnRenderTreeRasterized.bind(this, produced_time, TimeTicks.Now()));
  }

  ProcessOnRenderTreeRasterized(
    produced_time: TimeTicks,
    rasterized_time: TimeTicks) {
    // web_module_stat_tracker_->OnRenderTreeRasterized(produced_time,
    //                                                  rasterized_time);
    if (!this.last_render_tree_produced_time_ || produced_time.GE(this.last_render_tree_produced_time_)) {
      this.is_render_tree_rasterization_pending_ = false;
    }
  }

  onLayout(): void {
  }
}
