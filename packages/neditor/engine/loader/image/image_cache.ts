import { Image } from './image';
import { CachedResource, CachedResourceReferenceVector, CachedResourceReferenceWithCallbacks, ResourceCache, WeakCachedResource } from '../resource_cache';
import { LoaderFactory } from '../loader_factory';

type ResourceType = Image;
// |ImageResourceCacheType| provides the types and implements the functions
// required by |ResourceCache<ImageResourceCacheType>|
class ImageResourceCacheType {
  static GetEstimatedSizeInBytes(resource: ResourceType) {
    return resource.GetEstimatedSizeInBytes();
  }
};

export type CachedImage = CachedResource<ImageResourceCacheType, ResourceType>;
export type WeakCachedImage = WeakCachedResource<ImageResourceCacheType>;
export type CachedImageReferenceWithCallbacks = CachedResourceReferenceWithCallbacks<ResourceType>;
export type CachedImageReferenceVector = CachedResourceReferenceVector<ResourceType>

export type ImageCache = ResourceCache<ImageResourceCacheType, ResourceType>;

// CreateImageCache() provides a mechanism for creating an |ImageCache|.
export function CreateImageCache(
  name: string,
  // const base::DebuggerHooks& debugger_hooks,
  cache_capacity: number,
  loader_factory: LoaderFactory): ImageCache {
  return new ResourceCache<ImageResourceCacheType, ResourceType>(
    name,
    // debugger_hooks,
    cache_capacity,
    false /*are_loading_retries_enabled*/,
    loader_factory.CreateImageLoader.bind(loader_factory),
    loader_factory.NotifyResourceRequested.bind(loader_factory));
}

// // The ReducedCacheCapacityManager is a helper class that manages state which
// // makes it easy for clients to place the image cache in a reduced memory state,
// // at times when GPU memory is at a premium, such as when playing a video.
// // Clients should create ReducedCacheCapacityManager::Request objects to
// // indicate that they would like the image cache to enter a reduced capacity
// // state, internally, the manager keeps a reference count of how many Request
// // objects exist and enables the reduced capacity state if there is more than
// // one of them.
// class ReducedCacheCapacityManager {
//  public:
//   class Request {
//    public:
//     explicit Request(ReducedCacheCapacityManager* manager) : manager_(manager) {
//       manager_.IncrementRequestRefCount();
//     }
//     ~Request() { manager_.DecrementRequestRefCount(); }
//
//    private:
//     ReducedCacheCapacityManager* manager_;
//   };
//
//   ReducedCacheCapacityManager(ImageCache* cache,
//                               float reduced_capacity_percentage)
//       : cache_(cache),
//         request_ref_count_(0),
//         reduced_capacity_percentage_(reduced_capacity_percentage),
//         original_capacity_(cache_.capacity()),
//         reduced_capacity_(static_cast<uint32>(reduced_capacity_percentage_ *
//                                               original_capacity_)) {
//     DCHECK_GE(1.0f, reduced_capacity_percentage);
//   }
//
//   float reduced_capacity_percentage() const {
//     return reduced_capacity_percentage_;
//   }
//
//  private:
//   void IncrementRequestRefCount() {
//     if (request_ref_count_ == 0) {
//       cache_.SetCapacity(reduced_capacity_);
//     }
//     ++request_ref_count_;
//   }
//
//   void DecrementRequestRefCount() {
//     DCHECK_LT(0, request_ref_count_);
//     --request_ref_count_;
//     if (request_ref_count_ == 0) {
//       cache_.SetCapacity(original_capacity_);
//     }
//   }
//
//   ImageCache* cache_;
//   int request_ref_count_;
//   float reduced_capacity_percentage_;
//   const uint32 original_capacity_;
//   const uint32 reduced_capacity_;
// };
