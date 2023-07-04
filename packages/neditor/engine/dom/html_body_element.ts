import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLBodyElement extends HTMLElement {
  static kTagName = 'body';
  constructor(document: Document) {super(document, HTMLBodyElement.kTagName);}

  AsHTMLBodyElement(): HTMLBodyElement | null {
    return this;
  }
}
