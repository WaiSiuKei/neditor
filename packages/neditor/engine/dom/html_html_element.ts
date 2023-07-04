import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLHtmlElement extends HTMLElement {
  static kTagName = 'html';
  constructor(document: Document) {super(document, HTMLHtmlElement.kTagName);}
}
