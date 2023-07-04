// An img element represents an image.
//   https://www.w3.org/TR/html50/embedded-content-0.html#the-img-element
import { HTMLElement } from './html_element';
import type { Document } from './document';
import { CachedImage, WeakCachedImage } from '../loader/image/image_cache';
import { OnLoadedCallbackHandler } from '../loader/resource_cache';
import { DCHECK } from '@neditor/core/base/check';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Image } from '../render_tree/image';

export class HTMLImageElement extends HTMLElement {
  static kTagName = 'img';

  constructor(document: Document) {super(document, HTMLImageElement.kTagName);}
  // Web API: HTMLImageElement

  src() { return this.getAttribute('src') || ''; }
  set_src(src: string) { this.setAttribute('src', src); }

  // Custom, not in any spec.

  AsHTMLImageElement() { return this; }

  // From Node.
  private PurgeCachedBackgroundImagesOfNodeAndDescendants() {
    if (!this.cached_image_loaded_callback_handler_) {
      return;
    }

    // While we are still loading, treat this as an error.
    this.OnLoadingError();
  }

  // From Element.
  OnSetAttribute(name: string,
                 value: string) {
    // A user agent that obtains images immediately must synchronously update the
    // image data of an img element whenever that element is created with a src
    // attribute. A user agent that obtains images immediately must also
    // synchronously update the image data of an img element whenever that element
    // has its src or crossorigin attribute set, changed, or removed.
    if (name == 'src') {
      this.UpdateImageData();
    } else {
      HTMLElement.prototype.OnSetAttribute.call(this, name, value);
    }
  }
  OnRemoveAttribute(name: string) {
    // A user agent that obtains images immediately must synchronously update the
    // image data of an img element whenever that element is created with a src
    // attribute. A user agent that obtains images immediately must also
    // synchronously update the image data of an img element whenever that element
    // has its src or crossorigin attribute set, changed, or removed.
    if (name == 'src') {
      this.UpdateImageData();
    } else {
      HTMLElement.prototype.OnRemoveAttribute.call(this, name);
    }
  }

  // From the spec: HTMLImageElement.
  UpdateImageData() {
    DCHECK(this.GetDocument());
    TRACE_EVENT0('cobalt::dom', 'HTMLImageElement::UpdateImageData()');

    // 1. Not needed by Cobalt.

    // 2. If an instance of the fetching algorithm is still running for this
    // element, then abort that algorithm, discarding any pending tasks generated
    // by that algorithm.
    // 3. Forget the img element's current image data, if any.
    if (this.cached_image_loaded_callback_handler_) {
      this.cached_image_loaded_callback_handler_ = undefined;
      // prevent_gc_until_load_complete_.reset();
      this.GetDocument()!.DecreaseLoadingCounter();
    }

    // Keep the old weak cached image reference (if it exists) alive until after
    // we're done updating to the new one.
    // let old_weak_cached_image = this.weak_cached_image_;

    // 4. If the user agent cannot support images, or its support for images has
    // been disabled, then abort these steps.
    // 5. Otherwise, if the element has a src attribute specified and its value is
    // not the empty string, let selected source be the value of the element's src
    // attribute, and selected pixel density be 1.0. Otherwise, let selected
    // source be null and selected pixel density be undefined.
    let src_attr = this.getAttribute('src');
    let src = src_attr || '';

    // 6. Not needed by Cobalt.

    // 7. If selected source is not null, run these substeps:
    let cached_image: CachedImage;

    if (src) {
      // 7.1. Resolve selected source, relative to the element. If that is not
      // successful, abort these steps.
      // const GURL& base_url = node_document().url_as_gurl();
      // const GURL selected_source = base_url.Resolve(src);
      let selected_source = src;
      // if (!selected_source.is_valid()) {
      //   LOG(WARNING) << src << " cannot be resolved based on " << base_url << ".";
      //   return;
      // }

      // 7.2 Let key be a tuple consisting of the resulting absolute URL, the img
      // element's cross origin attribute's mode, and, if that mode is not No
      // CORS, the Document object's origin.
      // 7.3 If the list of available images contains an entry for key, then set
      // the img element to the completely available state, update the
      // presentation of the image appropriately, queue a task to fire a simple
      // event named load at the img element, and abort these steps.
      let image_cache = this.GetDocument()!.html_element_context().image_cache();
      cached_image = image_cache.GetOrCreateCachedResource(selected_source);
      DCHECK(cached_image);
      this.cached_image_ = cached_image;
      // this.weak_cached_image_ = image_cache.CreateWeakCachedResource(cached_image);
      // DCHECK(this.cached_image_);

      if (cached_image.TryGetResource()) {
        // PreventGarbageCollectionUntilEventIsDispatched(base::Tokens::load());
        return;
      }
    } else {
      // 8. 9. Not needed by Cobalt.
      // 10. If selected source is null, then set the element to the broken state,
      // queue a task to fire a simple event named error at the img element, and
      // abort these steps.
      if (src_attr) {
        // PreventGarbageCollectionUntilEventIsDispatched(base::Tokens::error());
      }
      return;
    }

    // 11. Not needed by Cobalt.

    // 12. Do a potentially CORS-enabled fetch of the absolute URL that resulted
    // from the earlier step, with the mode being the current state of the
    // element's crossorigin content attribute, the origin being the origin of the
    // img element's Document, and the default origin behaviour set to taint.
    // 13. Not needed by Cobalt.
    // 14. If the download was successful, fire a simple event named load at the
    // img element. Otherwise, queue a task to first fire a simple event named
    // error at the img element.
    // DCHECK(!prevent_gc_until_load_complete_);
    // prevent_gc_until_load_complete_.reset(
    //   new script::GlobalEnvironment::ScopedPreventGarbageCollection(
    //     html_element_context().script_runner().GetGlobalEnvironment(),
    //   this));
    this.GetDocument()!.IncreaseLoadingCounter();
    this.cached_image_loaded_callback_handler_ =
      new OnLoadedCallbackHandler(
        cached_image,
        this.OnLoadingSuccess.bind(this),
        this.OnLoadingError.bind(this)
      );
  }

  OnLoadingSuccess() {
    TRACE_EVENT0('cobalt::dom', 'HTMLImageElement::OnLoadingSuccess()');
    // AllowGarbageCollectionAfterEventIsDispatched(
    //   base::Tokens::load(), std::move(prevent_gc_until_load_complete_));
    if (this.GetDocument()) {
      this.GetDocument()!.DecreaseLoadingCounterAndMaybeDispatchLoadEvent();
    }
    // GetLoadTimingInfoAndCreateResourceTiming();
    this.cached_image_loaded_callback_handler_ = undefined;
  }
  OnLoadingError() {
    TRACE_EVENT0('cobalt::dom', 'HTMLImageElement::OnLoadingError()');
    // AllowGarbageCollectionAfterEventIsDispatched(
    //   base::Tokens::error(), std::move(prevent_gc_until_load_complete_));
    if (this.GetDocument()) {
      this.GetDocument()!.DecreaseLoadingCounterAndMaybeDispatchLoadEvent();
    }
    // GetLoadTimingInfoAndCreateResourceTiming();
    this.cached_image_loaded_callback_handler_ = undefined;
  }

  GetResource(): Image {
    return this.cached_image_?.TryGetResource()!;
  }
  // private PreventGarbageCollectionUntilEventIsDispatched(base::Token event_name);
  // void AllowGarbageCollectionAfterEventIsDispatched(
  //     base::Token event_name,
  //     std::unique_ptr<script::GlobalEnvironment::ScopedPreventGarbageCollection>
  //         scoped_prevent_gc);
  // void DestroyScopedPreventGC(
  //     std::unique_ptr<script::GlobalEnvironment::ScopedPreventGarbageCollection>
  //         scoped_prevent_gc);
  // // Create Performance Resource Timing entry for image element.
  // void GetLoadTimingInfoAndCreateResourceTiming();
  //
  private cached_image_?: CachedImage;
  private cached_image_loaded_callback_handler_?: OnLoadedCallbackHandler;

}

