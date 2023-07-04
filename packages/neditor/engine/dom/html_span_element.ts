import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLSpanElement extends HTMLElement {
  static kTagName = 'span';
  constructor(document?: Document) {
    if (document) {
      super(document, HTMLSpanElement.kTagName);
    } else {
      super(HTMLSpanElement.kTagName);
    }
  }
}
