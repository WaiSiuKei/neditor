import type { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLStrongElement extends HTMLElement {
  static kTagName = 'strong';
  constructor(document: Document) {super(document, HTMLStrongElement.kTagName);}
}
