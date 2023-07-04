// |RemoteTypefaceResourceCacheType| provides the types and implements the
// functions required by |ResourceCache<CacheType>|

import { Typeface } from '../../render_tree/typeface';
import { CachedResource, CachedResourceReferenceVector, CachedResourceReferenceWithCallbacks, ResourceCache } from '../resource_cache';
import { LoaderFactory } from '../loader_factory';

export type ResourceType = Typeface;

class RemoteTypefaceResourceCacheType {
  static GetEstimatedSizeInBytes(resource: ResourceType): number {
    return resource.GetEstimatedSizeInBytes();
  }
}

export type  CachedRemoteTypeface = CachedResource<RemoteTypefaceResourceCacheType, ResourceType>;
export type  CachedRemoteTypefaceReferenceWithCallbacks = CachedResourceReferenceWithCallbacks<ResourceType>
export type CachedRemoteTypefaceReferenceVector = CachedResourceReferenceVector<ResourceType>

export type   RemoteTypefaceCache = ResourceCache<RemoteTypefaceResourceCacheType, ResourceType>

// CreateTypefaceCache() provides a mechanism for creating a remote typeface
// cache.
export function CreateRemoteTypefaceCache(
  name: string,
// const base::DebuggerHooks& debugger_hooks,
 cache_capacity: number,
  loader_factory: LoaderFactory): RemoteTypefaceCache {
  return  new ResourceCache<RemoteTypefaceResourceCacheType, ResourceType>(
    name,
    // debugger_hooks,
    cache_capacity,
    true /*are_loading_retries_enabled*/,
    loader_factory.CreateTypefaceLoader.bind(loader_factory),
    loader_factory.NotifyResourceRequested.bind(loader_factory))
}
