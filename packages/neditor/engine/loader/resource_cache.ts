// CacheType must provide the following:
//   typedef SpecificResourceType ResourceType;
//   static uint32 GetEstimatedSizeInBytes(
//       const scoped_refptr<ResourceType>& resource);

import { Callback, Callback1, Callback2, Closure } from '@neditor/core/base/callback';
import { DCHECK } from '@neditor/core/base/check';
import { Optional } from '@neditor/core/base/common/typescript';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { Loader } from './loader';
import { IDisposable } from '@neditor/core/base/common/lifecycle';
import { DLOG, DLOG_IF, LOG, WARNING } from '@neditor/core/base/logging';
import { OneShotTimer } from '@neditor/core/base/timer/timer';
import { TimeDelta } from '@neditor/core/base/time/time';

enum CallbackType {
  kOnLoadingSuccessCallbackType,
  kOnLoadingErrorCallbackType,
  kCallbackTypeCount,
}

// This class can be used to attach success or error callbacks to
// CachedResource objects that are executed when the resource finishes
// loading.
// The callbacks are removed when the object is destroyed. If the resource
// has already been loaded, execute the callback immediately.
export class OnLoadedCallbackHandler implements IDisposable {
  constructor(
    cached_resource: ICachedResource,
    success_callback: Closure,
    error_callback: Closure) {
    this.cached_resource_ = cached_resource;
    this.success_callback_ = success_callback;
    this.error_callback_ = error_callback;
    DCHECK(this.cached_resource_);

    if (this.success_callback_) {
      this.cached_resource_.AddCallback(
        CallbackType.kOnLoadingSuccessCallbackType, this.success_callback_);
      if (this.cached_resource_.HasResource()) {
        this.success_callback_();
      }
    }

    if (this.error_callback_) {
      this.cached_resource_.AddCallback(
        CallbackType.kOnLoadingErrorCallbackType, this.error_callback_);
    }
  }
  dispose() {
    if (this.success_callback_) {
      this.cached_resource_.RemoveCallback(CallbackType.kOnLoadingSuccessCallbackType, this.success_callback_);
    }

    if (this.error_callback_) {
      this.cached_resource_.RemoveCallback(CallbackType.kOnLoadingErrorCallbackType, this.error_callback_);
    }
  }

  // net::LoadTimingInfo GetLoadTimingInfo();
  GetCachedResource() {
    return this.cached_resource_;
  }

  private cached_resource_: ICachedResource;
  private success_callback_: Closure;
  private error_callback_: Closure;
}

type  CallbackList = Closure[]
// type  CallbackList::iterator CallbackListIterator;
type  StartLoadingFunc = Callback<Loader>

interface ICachedResource {
  url(): string;
  IsLoadingComplete(): boolean;
  get_resource_timing_created_flag(): boolean;
  set_resource_timing_created_flag(is_created: boolean): void;
  AddCallback(callback_type: CallbackType, callback: Closure): void;
  RemoveCallback(callback_type: CallbackType, cb: Closure): void;
  HasResource(): boolean;
  EnableCompletionCallbacks(): void;
  OnLoadingComplete(error: Optional<string>): void;
  RunCallbacks(callback_type: CallbackType): void;
}

// CachedResource requests fetching and decoding a single resource and the
// decoded resource is stored in |resource_|. CachedResource is created by
// calling |GetOrCreateCachedResource| of the ResourceCache.
export class CachedResource<CacheType, ResourceType extends IResourceType> implements ICachedResource {
  url() { return this.url_; }
  // const Origin& origin() const { return origin_; }

  // Whether not the resource located at |url_| is finished loading.
  IsLoadingComplete(): boolean {
    return !this.loader_; /*&& !this.retry_timer_;*/
  }

  // net::LoadTimingInfo GetLoadTimingInfo() {
  //   return load_timing_info_;
  // }

  get_resource_timing_created_flag(): boolean {
    return this.is_resource_timing_created_flag_;
  }

  set_resource_timing_created_flag(is_created: boolean) {
    this.is_resource_timing_created_flag_ = is_created;
  }

  // Called by |CachedResourceLoadedCallbackHandler|.
  AddCallback(callback_type: CallbackType, callback: Closure) {
    let callback_list = this.callback_lists_[callback_type];
    callback_list.push(callback);
  }
  RemoveCallback(callback_type: CallbackType,
                 cb: Closure) {
    let callback_list = this.callback_lists_[callback_type];
    let idx = callback_list.indexOf(cb);
    DCHECK(idx !== -1);
    callback_list.splice(idx, 1);
  }
  RunCallbacks(callback_type: CallbackType) {
    // To avoid the list getting altered in the callbacks.
    let callback_list = this.callback_lists_[callback_type];
    for (let func of callback_list) {
      func();
    }
  }
  public EnableCompletionCallbacks() {
    this.are_completion_callbacks_enabled_ = true;
    if (this.completion_callback_) {
      this.completion_callback_();
    }
  }

  // Start loading the resource located at |url_|. This encompasses both
  // fetching and decoding it.
  StartLoading() {
    DCHECK(!this.loader_);
    // DCHECK(!retry_timer_ || !retry_timer_.IsRunning());

    this.loader_ = this.start_loading_func_();
  }

  // Schedule a loading retry on the resource located at |url_|. While there is
  // no limit on the number of retry attempts that can occur, the retry
  // scheduling uses an exponential backoff. The wait time doubles with each
  // subsequent attempt until a maximum wait time of 1024 seconds (~17 minutes)
  // is reached.
  protected ScheduleLoadingRetry() {
    NOTIMPLEMENTED();
  }

  // Notify the loading error.
  public OnLoadingComplete(error: Optional<string>) {

    // if (loader_ != nullptr) {
    //   load_timing_info_ = loader_->get_load_timing_info();
    // }

    // Success
    if (!error) {
      this.loader_ = undefined;
      // retry_timer_.reset();

      this.completion_callback_ =
        this.on_resource_loaded_.bind(null, CallbackType.kOnLoadingSuccessCallbackType);
      if (this.are_completion_callbacks_enabled_) {
        this.completion_callback_();
      }
      // Error
    } else {
      LOG(WARNING, ' Error while loading \'', this.url_, '\': ', error);

      if (this.HasResource()) {
        LOG(WARNING, 'A resource was produced but there was still an error.');
        this.ResetResource();
      }

      // let  should_retry = are_loading_retries_enabled_func_.Run() &&
      //       loader_->DidFailFromTransientError();

      this.loader_ = undefined;

      // if (should_retry) {
      //   ScheduleLoadingRetry();
      // } else {
      //   retry_timer_.reset();

      this.completion_callback_ =
        this.on_resource_loaded_.bind(null, CallbackType.kOnLoadingErrorCallbackType);
      if (this.are_completion_callbacks_enabled_) {
        this.completion_callback_();
      }
      // }
    }
  }

  protected owner_: IResourceCache;
  protected url_: string;
  // const Origin origin_;
  protected start_loading_func_: StartLoadingFunc;
  protected on_retry_loading_: Closure;
  protected are_loading_retries_enabled_func_: Callback<boolean>;
  protected on_resource_loaded_: Callback1<void, CallbackType>;

  protected loader_?: Loader;

  protected callback_lists_: Array<CallbackList> = [[], []];

  // In some cases (such as when the resource input data is stored in memory),
  // completion callbacks (e.g. resource fetch success/failure) could be
  // triggered from within the resource initialization callstack, and we are
  // not prepared to handle that. These members let us ensure that we are fully
  // initialized before we proceed with any completion callbacks.
  protected are_completion_callbacks_enabled_ = false;
  protected completion_callback_?: Closure;

  // When the resource cache is set to allow retries and a transient loading
  // error causes a resource to fail to load, a retry is scheduled.
  // int retry_count_ = 0;
  // std::unique_ptr<base::RetainingOneShotTimer> retry_timer_;

  // net::LoadTimingInfo load_timing_info_;
  protected is_resource_timing_created_flag_: boolean;

  // Request fetching and decoding a single resource based on the url.
  // CachedResource(
  //     const ResourceCache<CacheType>* owner, const GURL& url,
  //     const Origin& origin,
  //     const base::Callback<std::unique_ptr<Loader>(CachedResource*)>&
  //         start_loading_func,
  //     const base::Callback<void(CachedResourceBase*)>& on_retry_loading,
  //     const base::Callback<void(CachedResource*)>& on_resource_destroyed,
  //     const base::Callback<bool()>& are_loading_retries_enabled_func,
  //     const base::Callback<void(CachedResource*, CallbackType)>&
  //         on_resource_loaded);

  // Resource is available. CachedResource is a wrapper of the resource
  // and there is no need to fetch or load this resource again. |loader_|
  // is NULL in this case.
  constructor(
    owner: ResourceCache<CacheType, ResourceType>,
    url: string,
    resource: Optional<ResourceType>,
    start_loading_func: Callback1<Loader, CachedResource<CacheType, ResourceType>>,
    on_retry_loading: Callback1<void, ICachedResource>,
    on_resource_destroyed: Callback1<void, CachedResource<CacheType, ResourceType>>,
    are_loading_retries_enabled_func: Callback<boolean>,
    on_resource_loaded: Callback2<void, CachedResource<CacheType, ResourceType>, CallbackType>
  ) {
    this.owner_ = owner;
    this.url_ = url;
    this.start_loading_func_ = start_loading_func.bind(null, this) as Callback<Loader>,
      this.on_retry_loading_ = on_retry_loading.bind(null, this) as Callback<void>,
      // this.has_resource_func_ = has_resource_func;
      // this.reset_resource_func_ = reset_resource_func;
      this.are_loading_retries_enabled_func_ = are_loading_retries_enabled_func;
    this.on_resource_loaded_ = on_resource_loaded.bind(null, this);
    this.is_resource_timing_created_flag_ = false;
    this.resource_ = resource;
    if (!resource) {
      this.StartLoading();
    }
  }

  // ~CachedResource() override {
  //   if (retry_timer_) {
  //     retry_timer_.Stop();
  //   }
  //
  //   on_resource_destroyed_.Run(this);
  //
  //   for (int i = 0; i < kCallbackTypeCount; ++i) {
  //     DCHECK(callback_lists_[i].empty());
  //   }
  //
  //   loader_.reset();
  // }

  // If the resource is available in the cache, simply returns the resource. If
  // the resource loader is in loading status or encounters an error, still
  // returns |resource_| even if it is NULL to indicate no resource is
  // available.
  TryGetResource(): ResourceType {
    // DCHECK(this.resource_);
    return this.resource_!;
  }

  // Callbacks for decoders.
  //
  // Notify that the resource is loaded successfully.
  public OnContentProduced(resource: ResourceType) {
    DCHECK(!this.resource_);

    this.resource_ = resource;
  }

  HasResource() {
    return !!this.resource_;
  }
  ResetResource() {
    this.resource_ = undefined;
  }

  // private on_resource_destroyed_: Callback1<void, CachedResource>
  private resource_: Optional<ResourceType>;
}

// It is similar to CachedResource but doesn't hold a strong reference to the
// underlying resource, so the underlying resource can still be released during
// purging, after all unreferenced resources are released.
// It is created by calling |CreateWeakCachedResource|.
export class WeakCachedResource<CacheType> implements IDisposable {
  constructor(
    on_resource_destroyed_cb: Closure
  ) {
    this.on_resource_destroyed_cb_ = on_resource_destroyed_cb;
    DCHECK(this.on_resource_destroyed_cb_);
  }
  dispose() {
    this.on_resource_destroyed_cb_();
  }
  private on_resource_destroyed_cb_: Closure;
}

export type CachedResourceReferenceVector<CacheType> = CachedResourceReferenceWithCallbacks<CacheType>[]
type CachedResourceTypeOnLoadedCallbackHandler = OnLoadedCallbackHandler

// TODO: Collapse this into OnLoadedCallbackHandler.
export class CachedResourceReferenceWithCallbacks<CacheType> {
  // typedef CachedResource<CacheType> CachedResourceType;
  constructor(
    cached_resource: ICachedResource,
    content_produced_callback: Closure,
    load_complete_callback: Closure
  ) {
    this.cached_resource_loaded_callback_handler_ = new OnLoadedCallbackHandler(
      cached_resource,
      content_produced_callback,
      load_complete_callback
    );
  }

  GetCachedResource() {
    return this.cached_resource_loaded_callback_handler_.GetCachedResource();
  }

  // private:
  // This handles adding and removing the resource loaded callbacks.
  // CachedResourceTypeOnLoadedCallbackHandler
  private cached_resource_loaded_callback_handler_: CachedResourceTypeOnLoadedCallbackHandler;
};

type ReclaimMemoryFunc = (bytes_to_reclaim_down_to: number, log_warning_if_over: boolean) => void

class ResourceCallbackInfo {
  constructor(
    public cached_resource: ICachedResource,
    public callback_type: CallbackType,
  ) {}
}

type ResourceSet = Set<string>

type  ResourceCallbackMap = Map<string, ResourceCallbackInfo>;

interface IResourceCache {}

// CachedResource is created by calling |GetOrCreateCachedResource| of
// ResourceCache.
// ResourceCache can have observers and when a resource is loaded,
// ResourceCache would notify its observers. For example, a DOM Document might
// be an observer of ResourceCache.

// Call this function to notify the caller that this resource is requested.
type NotifyResourceRequestedFunction = (str: string) => void
type CreateLoaderFunction<ResourceType> = (
  url: string,
  cb1: Callback1<void, ResourceType>,
  cb2: Callback1<void, Optional<string>>
) => Loader

export class ResourceCache<CacheType, ResourceType extends IResourceType> implements IResourceCache {

  // The name of this resource cache object, useful while debugging.
  protected name_: string;

  // const base::DebuggerHooks& debugger_hooks_;

  protected are_loading_retries_enabled_: boolean;

  protected cache_capacity_: number;

  // csp::SecurityCallback security_callback_;

  // The resource cache attempts to batch callbacks as much as possible to try
  // to ensure that events triggered by the callbacks occur together. It
  // accomplishes this by waiting for all active loads to complete before
  // processing any of their callbacks. However, to ensure that callbacks are
  // processed in a timely manner as well, active loads are placed into two
  // buckets: callback blocking and non-callback blocking. While no callbacks
  // are pending, all active loads are added as callback blocking. As soon as
  // a callback is pending, any additional load requests are added as
  // non-callback blocking. As soon as all of the callback blocking loads are
  // finished, the pending callbacks are processed, the non-callback blocking
  // loads become callback blocking loads, and the process repeats itself.

  // Currently loading resources that block any pending callbacks from running.
  private callback_blocking_loading_resource_set_: ResourceSet = new Set<string>();
  // Currently loading resources that do not block the pending callbacks from
  // running. After pending callbacks run, these become blocking.
  private non_callback_blocking_loading_resource_set_: ResourceSet = new Set<string>();
  // Resources that have completed loading and have callbacks pending.
  private pending_callback_map_: ResourceCallbackMap = new Map<string, ResourceCallbackInfo>();
  // Timer used to ensure that pending callbacks are handled in a timely manner
  // when callbacks are being blocked by additional loading resources.
  private process_pending_callback_timer_: OneShotTimer = new OneShotTimer();

  // Whether or not ProcessPendingCallbacks() is running.
  private is_processing_pending_callbacks_ = false;
  // Whether or not callbacks are currently disabled.
  private are_callbacks_disabled_ = false;

  private memory_size_in_bytes_: number;
  private memory_capacity_in_bytes_: number;
  private memory_resources_loaded_in_bytes_: number;

  private count_resources_requested_: number;
  private count_resources_loading_: number;
  private count_resources_loaded_: number;
  private count_resources_cached_: number;
  private count_pending_callbacks_: number;

  // Set a callback that the loader will query to determine if the URL is safe
  // according to our document's security policy.
  // void set_security_callback(const csp::SecurityCallback& security_callback) {
  //   security_callback_ = security_callback;
  // }
  // const csp::SecurityCallback& security_callback() const {
  //   return security_callback_;
  // }

  // Called by CachedResource objects when they fail to load as a result of a
  // transient error and are scheduling a retry.
  public NotifyResourceLoadingRetryScheduled(cached_resource: ICachedResource) {
    NOTIMPLEMENTED();
    // let url = cached_resource.url();
    //
    // // Remove the resource from those currently loading. It'll be re-added once
    // // the retry starts.
    //
    // // Remove the resource from its loading set. It should exist in exactly one
    // // of the loading sets.
    // if (callback_blocking_loading_resource_set_.erase(url)) {
    //   DCHECK(non_callback_blocking_loading_resource_set_.find(url) ==
    //     non_callback_blocking_loading_resource_set_.end());
    // } else if (!non_callback_blocking_loading_resource_set_.erase(url)) {
    //   DCHECK(false);
    // }
    //
    // --count_resources_loading_;
    //
    // ProcessPendingCallbacksIfUnblocked();
  }

  // Reclaims memory from unreferenced cache objects until total cache memory
  // is reduced to |bytes_to_reclaim_down_to|. In the case where the desired
  // memory cannot be freed, pending callbacks are processed (potentially
  // enabling additional resources to be reclaimed), and memory reclamation is
  // attempted again.
  protected ReclaimMemoryAndMaybeProcessPendingCallbacks(bytes_to_reclaim_down_to: number) {
    this.ReclaimMemory(bytes_to_reclaim_down_to,
      false /*log_warning_if_over*/);
    // If the current size of the cache is still greater than
    // |bytes_to_reclaim_down_to| after reclaiming memory, then process any
    // pending callbacks and try again. References to the cached resources are
    // potentially being held until the callbacks run, so processing them may
    // enable more memory to be reclaimed.
    if (this.memory_size_in_bytes_ > bytes_to_reclaim_down_to) {
      this.ProcessPendingCallbacks();
      this.ReclaimMemory(bytes_to_reclaim_down_to,
        true /*log_warning_if_over*/);
    }
  }

  // Calls ProcessPendingCallbacks() if
  // |callback_blocking_loading_resource_set_| is empty.
  protected ProcessPendingCallbacksIfUnblocked() {
    // If there are no callback blocking resources, then simply process any
    // pending callbacks now; otherwise, start |process_pending_callback_timer_|,
    // which ensures that the callbacks are handled in a timely manner while still
    // allowing them to be batched.
    if (this.callback_blocking_loading_resource_set_.size === 0) {
      this.ProcessPendingCallbacks();

      // Now that we've processed the callbacks, if there are any non-blocking
      // loading resources, then they're becoming blocking. Simply swap the two
      // sets, rather than copying the contents over.
      if (this.non_callback_blocking_loading_resource_set_.size) {
        let tmp = this.callback_blocking_loading_resource_set_;
        this.callback_blocking_loading_resource_set_ = this.non_callback_blocking_loading_resource_set_;
        this.non_callback_blocking_loading_resource_set_ = tmp;
      }
    } else if (this.pending_callback_map_.size /*&&
      !this.process_pending_callback_timer_.IsRunning()*/) {
      // The maximum delay for a pending callback is set to 500ms. After that, the
      // callback will be processed regardless of how many callback blocking
      // loading resources remain. This specific value maximizes callback batching
      // on fast networks while also keeping the callback delay on slow networks
      // to a minimum and is based on significant testing.
      const kMaxPendingCallbackDelayInMilliseconds = 500;
      this.process_pending_callback_timer_.Start(
        TimeDelta.FromMilliseconds(
          kMaxPendingCallbackDelayInMilliseconds),
        this.ProcessPendingCallbacks.bind(this));
    }
  }

  protected are_loading_retries_enabled() {
    return this.are_loading_retries_enabled_;
  }

  capacity() { return this.cache_capacity_; }
  SetCapacity(capacity: number) {
    this.cache_capacity_ = capacity;
    this.memory_capacity_in_bytes_ = capacity;
    this.ReclaimMemoryAndMaybeProcessPendingCallbacks(this.cache_capacity_);
  }

  Purge() {
    this.ProcessPendingCallbacks();
    this.ReclaimMemoryAndMaybeProcessPendingCallbacks(0);
  }

  // Processes all pending callbacks regardless of the state of
  // |callback_blocking_loading_resource_set_|.
  ProcessPendingCallbacks() {
    // If callbacks are disabled, simply return.
    if (this.are_callbacks_disabled_) {
      return;
    }

    this.is_processing_pending_callbacks_ = true;
    for (let [k, callback_info] of this.pending_callback_map_) {
      callback_info.cached_resource.RunCallbacks(callback_info.callback_type);
      this.pending_callback_map_.delete(k);
    }
    this.is_processing_pending_callbacks_ = false;
    this.count_pending_callbacks_ = 0;
  }

  DisableCallbacks() {
    this.are_callbacks_disabled_ = true;
  }

  constructor(
    name: string,
    // const base::DebuggerHooks& debugger_hooks,
    cache_capacity: number,
    are_loading_retries_enabled: boolean,
    create_loader_function: CreateLoaderFunction<ResourceType>,
    notify_resource_requested_function: NotifyResourceRequestedFunction
  ) {
    this.name_ = name;
    // debugger_hooks_(debugger_hooks),
    this.are_loading_retries_enabled_ = are_loading_retries_enabled;
    this.cache_capacity_ = cache_capacity;
    this.memory_size_in_bytes_ = 0;
    this.memory_capacity_in_bytes_ = this.cache_capacity_;
    this.memory_resources_loaded_in_bytes_ = 0;
    this.count_resources_requested_ = 0;
    this.count_resources_loading_ = 0;
    this.count_resources_loaded_ = 0;
    this.count_resources_cached_ = 0;
    this.count_pending_callbacks_ = 0;
    this.create_loader_function_ = create_loader_function;
    this.notify_resource_requested_function_ = notify_resource_requested_function;
    DCHECK(this.create_loader_function_);
  }
  // ~ResourceCache() {
  //   DCHECK(weak_cached_resource_ref_count_map_.empty());
  //   DCHECK(cached_resource_map_.empty());
  // }

  // |GetOrCreateCachedResource| returns CachedResource. If the CachedResource
  // is not in |cached_resource_map_| or its resource is not in
  // |unreferenced_cached_resource_map_|, creates a CachedResource with a loader
  // for it. If the CachedResource is in the cache map, return the
  // CachedResource or wrap the resource if necessary.
  GetOrCreateCachedResource(url: string): CachedResource<CacheType, ResourceType> {
    DCHECK(url);

    // TODO: We should also notify the fetcher cache when the resource is
    // destroyed.
    if (this.notify_resource_requested_function_) {
      this.notify_resource_requested_function_(url);
    }

    // Try to find the resource from |cached_resource_map_|.
    for (let [k, v] of this.cached_resource_map_) {
      if (k === url) return v;
    }

    // Try to find the resource from |unreferenced_cached_resource_map_|.
    // auto resource_iterator = unreferenced_cached_resource_map_.find(url.spec());
    // if (resource_iterator != unreferenced_cached_resource_map_.end()) {
    //   scoped_refptr<CachedResourceType> cached_resource(new CachedResourceType(
    //       this, url, resource_iterator.second.get(),
    //       base::Bind(&ResourceCache::StartLoadingResource,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::NotifyResourceLoadingRetryScheduled,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::NotifyResourceDestroyed,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::are_loading_retries_enabled,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::NotifyResourceLoadingComplete,
    //                  base::Unretained(this))));
    //   cached_resource_map_.insert(
    //       std::make_pair(url.spec(), cached_resource.get()));
    //   unreferenced_cached_resource_map_.erase(resource_iterator);
    //   return cached_resource;
    // }

    // Try to find the resource from |weak_referenced_cached_resource_map_|.
    // resource_iterator = weak_referenced_cached_resource_map_.find(url.spec());
    // if (resource_iterator != weak_referenced_cached_resource_map_.end()) {
    //   scoped_refptr<CachedResourceType> cached_resource(new CachedResourceType(
    //       this, url, resource_iterator.second.get(),
    //       base::Bind(&ResourceCache::StartLoadingResource,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::NotifyResourceLoadingRetryScheduled,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::NotifyResourceDestroyed,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::are_loading_retries_enabled,
    //                  base::Unretained(this)),
    //       base::Bind(&ResourceCache::NotifyResourceLoadingComplete,
    //                  base::Unretained(this))));
    //   cached_resource_map_.insert(
    //       std::make_pair(url.spec(), cached_resource.get()));
    //   weak_referenced_cached_resource_map_.erase(resource_iterator);
    //   return cached_resource;
    // }

    // If we reach this point, then the resource doesn't exist yet.
    ++this.count_resources_requested_;

    // Create the cached resource and fetch its resource based on the url.
    let cached_resource = new CachedResource<CacheType, ResourceType>(
      this,
      url,
      undefined,
      this.StartLoadingResource.bind(this),
      this.NotifyResourceLoadingRetryScheduled.bind(this),
      this.NotifyResourceDestroyed.bind(this),
      this.are_loading_retries_enabled.bind(this),
      this.NotifyResourceLoadingComplete.bind(this),
    );
    this.cached_resource_map_.set(url, cached_resource);

    // Only now that we are finished initializing |cached_resource|, allow
    // completion callbacks to proceed. This can be an issue for resources that
    // load and decode synchronously and immediately.
    cached_resource.EnableCompletionCallbacks();

    return cached_resource;
  }

  // |CreateWeakCachedResource| returns a WeakCachedResource referenced to the
  // same resource identified by the url of |cached_resource|.  A weak
  // referenced resource may still be released during purging, but only after
  // all unreferenced resources are released.
  // std::unique_ptr<WeakCachedResourceType> CreateWeakCachedResource(
  //     const scoped_refptr<CachedResourceType>& cached_resource);

  // typedef base::hash_map<std::string, CachedResourceType*> CachedResourceMap;
  // typedef net::linked_hash_map<std::string, int> WeakCachedResourceRefCountMap;
  // typedef net::linked_hash_map<std::string, scoped_refptr<ResourceType>>
  //     ResourceMap;

  private StartLoadingResource(cached_resource: CachedResource<CacheType, ResourceType>): Loader {
    let url = cached_resource.url();

    // The resource should not already be in either of the loading sets.
    // DCHECK(callback_blocking_loading_resource_set_.find(url) ==
    //   callback_blocking_loading_resource_set_.end());
    // DCHECK(non_callback_blocking_loading_resource_set_.find(url) ==
    //   non_callback_blocking_loading_resource_set_.end());

    // Add the resource to a loading set. If no current resources have pending
    // callbacks, then this resource will block callbacks until it is decoded.
    // However, if there are resources with pending callbacks, then the decoding
    // of this resource won't block the callbacks from occurring. This ensures
    // that a steady stream of new resources won't prevent callbacks from ever
    // occurring.
    if (this.pending_callback_map_.size === 0) {
      this.callback_blocking_loading_resource_set_.add(url);
    } else {
      this.non_callback_blocking_loading_resource_set_.add(url);
    }

    ++this.count_resources_loading_;

    return this.create_loader_function_(
      cached_resource.url(),
      // cached_resource.origin(),
      // security_callback_,
      cached_resource.OnContentProduced.bind(cached_resource),
      cached_resource.OnLoadingComplete.bind(cached_resource));
  }

  // Called by CachedResource objects after they finish loading.
  private NotifyResourceLoadingComplete(cached_resource: CachedResource<CacheType, ResourceType>,
                                        callback_type: CallbackType) {
    const url = cached_resource.url();

    if (cached_resource.TryGetResource()) {
      let res = cached_resource.TryGetResource();
      let estimated_size_in_bytes = res.GetEstimatedSizeInBytes();
      this.memory_size_in_bytes_ += estimated_size_in_bytes;
      this.memory_resources_loaded_in_bytes_ += estimated_size_in_bytes;

      ++this.count_resources_loaded_;
      ++this.count_resources_cached_;
    }

    // Remove the resource from its loading set. It should exist in exactly one
    // of the loading sets.
    if (this.callback_blocking_loading_resource_set_.has(url)) {
      this.callback_blocking_loading_resource_set_.delete(url);
      DCHECK(!this.non_callback_blocking_loading_resource_set_.has(url));
    } else if (this.non_callback_blocking_loading_resource_set_.has(url)) {
      this.non_callback_blocking_loading_resource_set_.delete(url);
    } else {
      DCHECK(false);
    }

    // Add a callback for the resource that just finished loading to the pending
    // callbacks.
    this.pending_callback_map_.set(url, new ResourceCallbackInfo(cached_resource, callback_type));

    // Update the loading resources and pending callbacks count. The callbacks are
    // incremented first to ensure that the total of the two counts always remains
    // above 0.
    ++this.count_pending_callbacks_;
    --this.count_resources_loading_;

    this.ProcessPendingCallbacksIfUnblocked();
    this.ReclaimMemoryAndMaybeProcessPendingCallbacks(this.cache_capacity_);
  }

  // Called by the destructor of CachedResource to remove CachedResource from
  // |cached_resource_map_| and add it to |weak_referenced_cached_resource_map_|
  // or |unreferenced_cached_resource_map_|, depending on whether the resource
  // is still weakly referenced.
  // It will then start purging and may immediately free the resource from
  // memory ifthe cache is over its memory limit.
  private NotifyResourceDestroyed(cached_resource: CachedResource<CacheType, ResourceType>) {
    NOTIMPLEMENTED();
  }

  // Called by the destructor of WeakCachedResource to remove WeakCachedResource
  // from |weak_cached_resource_ref_count_map_| and add it to
  // |unreferenced_cached_resource_map_|.
  private NotifyWeakResourceDestroyed(url: string) {
    NOTIMPLEMENTED();
  }

  // Releases unreferenced cache objects until our total cache memory usage is
  // less than or equal to |bytes_to_reclaim_down_to|, or until there are no
  // more unreferenced cache objects to release.
  private ReclaimMemory(bytes_to_reclaim_down_to: number, log_warning_if_over: boolean) {

    let resource_maps = [
      this.unreferenced_cached_resource_map_,
      // this.weak_referenced_cached_resource_map_
    ];

    for (let i = 0; i < resource_maps.length; ++i) {
      while (this.memory_size_in_bytes_ > bytes_to_reclaim_down_to &&
      resource_maps[i].size) {
        // The first element is the earliest-inserted element.
        let keys = Array.from(resource_maps[i].keys());
        let first_key = keys[0];
        let resource = resource_maps[i].get(first_key) as ResourceType;
        let first_resource_size = resource.GetEstimatedSizeInBytes();
        // Erase the earliest-inserted element.
        // TODO: Erasing the earliest-inserted element could be a function
        // in linked_hash_map. Add that function and related unit test.
        resource_maps[i].delete(first_key);
        this.memory_size_in_bytes_ -= first_resource_size;
        --this.count_resources_cached_;
      }
    }

    if (log_warning_if_over) {
      // Log a warning if we're still over |bytes_to_reclaim_down_to| after
      // attempting to reclaim memory. This can occur validly when the size of
      // the referenced images exceeds the target size.
      DLOG_IF(WARNING, this.memory_size_in_bytes_ > bytes_to_reclaim_down_to,
        'cached size: ', this.memory_size_in_bytes_,
        ', target size: ', bytes_to_reclaim_down_to);
    }
  }

  private create_loader_function_: CreateLoaderFunction<ResourceType>;
  private notify_resource_requested_function_: NotifyResourceRequestedFunction;

  // Stores the cached resources that are currently referenced.
  private cached_resource_map_: Map<string, CachedResource<CacheType, ResourceType>> = new Map();

  // Stores the urls to the cached resources that are weakly referenced, with
  // their ref counts.
  // WeakCachedResourceRefCountMap weak_cached_resource_ref_count_map_;

  // Stores the cached resources that are not referenced, but are being kept in
  // memory as a result of the cache being under its memory limit.
  private unreferenced_cached_resource_map_: Map<string, ResourceType> = new Map<string, ResourceType>();

  // Stores the cached resources that are weakly referenced, they will be
  // released during purging, once all resources in the above defined
  // |unreferenced_cached_resource_map_| are released.
  // While it could be great to sort the resources by both the reference counts
  // and the last usage, in reality all ref counts are 1 and we only need to put
  // new items at the end of the map.
  // ResourceMap weak_referenced_cached_resource_map_;

  // base::Callback<void(const net::LoadTimingInfo&)> load_timing_info_callback_;
}

export interface IResourceType {
  GetEstimatedSizeInBytes(): number;
}

// template <typename CacheType>
// std::unique_ptr<WeakCachedResource<CacheType>>
// ResourceCache<CacheType>::CreateWeakCachedResource(
//     const scoped_refptr<CachedResourceType>& cached_resource) {
//   DCHECK_CALLED_ON_VALID_THREAD(resource_cache_thread_checker_);
//   DCHECK(cached_resource);
//
//   auto url = cached_resource.url().spec();
//   std::unique_ptr<WeakCachedResourceType> weak_cached_resource(
//       new WeakCachedResourceType(
//           base::Bind(&ResourceCache::NotifyWeakResourceDestroyed,
//                      base::Unretained(this), url)));
//
//   auto iterator = weak_cached_resource_ref_count_map_.find(url);
//   int ref_count = 1;
//   if (iterator != weak_cached_resource_ref_count_map_.end()) {
//     ref_count = iterator.second + 1;
//     weak_cached_resource_ref_count_map_.erase(iterator);
//   }
//   weak_cached_resource_ref_count_map_.insert(std::make_pair(url, ref_count));
//
//   return weak_cached_resource;
// }

// template <typename CacheType>
// void ResourceCache<CacheType>::NotifyResourceDestroyed(
//     CachedResourceType* cached_resource) {
//   DCHECK_CALLED_ON_VALID_THREAD(resource_cache_thread_checker_);
//   const std::string& url = cached_resource.url().spec();
//
//   cached_resource_map_.erase(url);
//
//   DCHECK(weak_referenced_cached_resource_map_.find(url) ==
//          weak_referenced_cached_resource_map_.end());
//   DCHECK(unreferenced_cached_resource_map_.find(url) ==
//          unreferenced_cached_resource_map_.end());
//
//   // Check to see if this was a loaded resource.
//   if (cached_resource.TryGetResource()) {
//     if (weak_cached_resource_ref_count_map_.find(url) !=
//         weak_cached_resource_ref_count_map_.end()) {
//       // Add it into the weak referenced cached resource map, so that it will be
//       // retained while memory is available for it in the cache, and will be
//       // purged after all unreferenced cached resources.
//       weak_referenced_cached_resource_map_.insert(
//           std::make_pair(url, cached_resource.TryGetResource()));
//     } else {
//       // Add it into the unreferenced cached resource map, so that it will be
//       // retained while memory is available for it in the cache.
//       unreferenced_cached_resource_map_.insert(
//           std::make_pair(url, cached_resource.TryGetResource()));
//     }
//   }
//
//   // Remove the resource from any loading or pending container that it is in.
//   // It should never exist in more than one of the containers.
//   if (callback_blocking_loading_resource_set_.erase(url)) {
//     DCHECK(non_callback_blocking_loading_resource_set_.find(url) ==
//            non_callback_blocking_loading_resource_set_.end());
//     DCHECK(pending_callback_map_.find(url) == pending_callback_map_.end());
//     --count_resources_loading_;
//   } else if (non_callback_blocking_loading_resource_set_.erase(url)) {
//     DCHECK(pending_callback_map_.find(url) == pending_callback_map_.end());
//     --count_resources_loading_;
//   } else if (pending_callback_map_.erase(url)) {
//     --count_pending_callbacks_;
//   }
//
//   // Only process pending callbacks and attempt to reclaim memory if
//   // NotifyResourceDestroyed() wasn't called from within
//   // ProcessPendingCallbacks(). This prevents recursion and redundant
//   // processing.
//   if (!is_processing_pending_callbacks_) {
//     ProcessPendingCallbacksIfUnblocked();
//     ReclaimMemory(cache_capacity_, true /*log_warning_if_over*/);
//   }
// }

// template <typename CacheType>
// void ResourceCache<CacheType>::NotifyWeakResourceDestroyed(
//     const std::string& url) {
//   DCHECK_CALLED_ON_VALID_THREAD(resource_cache_thread_checker_);
//
//   auto iterator = weak_cached_resource_ref_count_map_.find(url);
//   DCHECK(iterator != weak_cached_resource_ref_count_map_.end());
//   if (iterator.second > 1) {
//     --iterator.second;
//     return;
//   }
//
//   weak_cached_resource_ref_count_map_.erase(iterator);
//   auto resource_iterator = weak_referenced_cached_resource_map_.find(url);
//   if (resource_iterator != weak_referenced_cached_resource_map_.end()) {
//     unreferenced_cached_resource_map_.insert(
//         std::make_pair(resource_iterator.first, resource_iterator.second));
//     weak_referenced_cached_resource_map_.erase(resource_iterator);
//   }
// }
