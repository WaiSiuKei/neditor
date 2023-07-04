import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLAnchorElement extends HTMLElement {
  static kTagName = 'a';
  constructor(document: Document) {super(document, HTMLAnchorElement.kTagName);}
}
