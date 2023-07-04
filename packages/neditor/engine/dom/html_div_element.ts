import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLDivElement extends HTMLElement {
  static kTagName = 'div';
  constructor()
  constructor(document: Document)
  constructor(document?: Document) {
    if (document) {
      super(document, HTMLDivElement.kTagName);
    } else {
      super(HTMLDivElement.kTagName);
    }
  }
}
