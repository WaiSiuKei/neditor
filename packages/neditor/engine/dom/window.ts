import { ViewportSize } from '../cssom/viewport_size';
import { Document, Options } from './document';
import { HTMLElementContext } from './html_element_context';
import { Performance } from './performance';
import { BasicClock, SystemMonotonicClock } from '../base/clock';
import { ResourceProvider } from '../render_tree/resource_provider';
import type { ImageCache } from '../loader/image/image_cache';
import { RemoteTypefaceCache } from '../loader/font/remote_typeface_cache';

export class Window {
  document_: Document;
  html_element_context_: HTMLElementContext;
  performance_: Performance;
  constructor(
    view_size: ViewportSize,
    resource_provider: ResourceProvider,
    image_cache: ImageCache,
    remote_typeface_cache: RemoteTypefaceCache,
    font_language_script: string,
    dom_max_element_depth: number,
  ) {
    this.html_element_context_ = new HTMLElementContext(
      resource_provider,
      image_cache,
      remote_typeface_cache,
      font_language_script);
    this.performance_ = new Performance(MakePerformanceClock());
    this.document_ = new Document(
      this.html_element_context_,
      new Options(
        this,
        this.performance_.timing().GetNavigationStartClock(),
        view_size,
        dom_max_element_depth,
      )
    );
  }

  document() {return this.document_;}
  performance() {return this.performance_;}
  html_element_context() {return this.html_element_context_;}
}

function MakePerformanceClock(): BasicClock {
  return new SystemMonotonicClock();
}
