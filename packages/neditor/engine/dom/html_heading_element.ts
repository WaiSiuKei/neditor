// These elements represent headings for their sections.
//   https://www.w3.org/TR/html50/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements
import { HTMLElement } from './html_element';

export class HTMLHeadingElement extends HTMLElement {
  static kTagNames = ['h1', 'h2', 'h3',
    'h4', 'h5', 'h6'];
}
