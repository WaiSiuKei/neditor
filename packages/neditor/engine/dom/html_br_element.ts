// The br element represents a line break.
//   https://www.w3.org/TR/html50/text-level-semantics.html#the-br-element
import { Document } from './document';
import { HTMLElement } from './html_element';

export class HTMLBRElement extends HTMLElement {
  static kTagName = 'br';
  constructor(document: Document) {super(document, HTMLBRElement.kTagName);}

  // Custom, not in any spec.
  AsHTMLBRElement() { return this; }
};
