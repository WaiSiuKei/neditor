import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLEmElement extends HTMLElement {
  static kTagName = 'em';
  constructor(document: Document) {super(document, HTMLEmElement.kTagName);}
}
