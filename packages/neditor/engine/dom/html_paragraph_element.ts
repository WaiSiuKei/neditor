import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLParagraphElement extends HTMLElement {
  static kTagName = 'p';
  constructor(document: Document) {
    super(document, HTMLParagraphElement.kTagName);
  }
}
