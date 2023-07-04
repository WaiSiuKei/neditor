import type { Document } from './document';
import { HTMLDivElement } from './html_div_element';
import { HTMLParagraphElement } from './html_paragraph_element';
import { HTMLSpanElement } from './html_span_element';
import { HTMLEmElement } from './html_em_element';
import { HTMLStrongElement } from './html_strong_element';
import { HTMLHtmlElement } from './html_html_element';
import { HTMLBodyElement } from './html_body_element';
import type { HTMLElement } from './html_element';
import { HTMLHeadingElement } from './html_heading_element';
import { HTMLAnchorElement } from './html_anchor_element';
import { HTMLImageElement } from './html_image_element';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { FreehandElement } from "./custom/freehand_element";
import { HTMLBRElement } from "./html_br_element";

type CreateHTMLElementTCallback = (document: Document) => HTMLElement
type TagNameToCreateHTMLElementTCallbackMap = Map<string, CreateHTMLElementTCallback>

export class ElementFactory {
  tag_name_to_create_html_element_t_callback_map_: TagNameToCreateHTMLElementTCallbackMap = new Map<string, CreateHTMLElementTCallback>();

  constructor() {
    this.RegisterHTMLElementWithSingleTagName(HTMLAnchorElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLDivElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLParagraphElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLSpanElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLEmElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLStrongElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLHtmlElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLBodyElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLImageElement);
    this.RegisterHTMLElementWithSingleTagName(HTMLBRElement);

    this.RegisterHTMLElementWithSingleTagName(FreehandElement);

    this.RegisterHTMLElementWithMultipleTagName(HTMLHeadingElement);
  }

  CreateElement(document: Document, local_name: string) {
    let func = this.tag_name_to_create_html_element_t_callback_map_.get(local_name);
    if (func) {
      return func(document);
    } else {
      // console.log(local_name);
      //   LOG_IF(WARNING, !IsValidCustomElementName(tag_name))
      //   << "Unknown HTML element: <" << tag_name << ">.";
      //   return new HTMLUnknownElement(document, tag_name);
      NOTIMPLEMENTED();
    }
  }

  RegisterHTMLElementWithSingleTagName<T extends HTMLElement>(Ctor: Constructor<T>) {
    this.tag_name_to_create_html_element_t_callback_map_.set((<any>Ctor).kTagName, CreateHTMLElementT.bind(null, Ctor));
  }

  RegisterHTMLElementWithMultipleTagName<T extends HTMLElement>(Ctor: Constructor<T>) {
    for (let name of (<any>Ctor).kTagNames as string[]) {
      this.tag_name_to_create_html_element_t_callback_map_.set(name, CreateHTMLElementWithTagNameT.bind(null, Ctor, name));
    }
  }
}

export type Constructor<T> = new (...args: any[]) => T

function CreateHTMLElementT<T extends HTMLElement>(Ctor: Constructor<T>, document: Document,): T {
  return new Ctor(document);
}

function CreateHTMLElementWithTagNameT<T extends HTMLElement>(Ctor: Constructor<T>, local_name: string, document: Document): T {
  return new Ctor(document, local_name);
}
