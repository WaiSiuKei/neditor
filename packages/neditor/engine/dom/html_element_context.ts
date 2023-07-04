// This class contains references to several objects that are required by HTML
// elements, including HTML element factory, which is used to create new
// HTML elements.
import { ResourceProvider } from '../render_tree/resource_provider';
import { ImageCache } from '../loader/image/image_cache';
import { RemoteTypefaceCache } from '../loader/font/remote_typeface_cache';

export class HTMLElementContext {
  private resource_provider_: ResourceProvider;
  private image_cache_: ImageCache;
  private font_language_script_: string;
  private remote_typeface_cache_: RemoteTypefaceCache;

  constructor(
    resource_provider: ResourceProvider,
    image_cache: ImageCache,
    remote_typeface_cache: RemoteTypefaceCache,
    font_language_script: string
  ) {
    this.resource_provider_ = resource_provider;
    this.image_cache_ = image_cache;
    this.remote_typeface_cache_ = remote_typeface_cache;
    this.font_language_script_ = font_language_script;
  }

  font_language_script() {
    return this.font_language_script_;
  }
  resource_provider(): ResourceProvider {
    return this.resource_provider_;
  }
  image_cache() {
    return this.image_cache_;
  }
  remote_typeface_cache() {
    return this.remote_typeface_cache_;
  }
};
