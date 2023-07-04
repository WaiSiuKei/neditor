import { NOTIMPLEMENTED, NOTREACHED } from '../../../../../base/common/notreached';
import { isObject } from '../../../../../base/common/type';
import { kStyleAttributeName } from '../../../../../engine/dom/element';
import { DOMNode } from '../view/dom';
import { HTMLElement } from '../../../../../engine/dom/html_element';
import { Document } from '../../../../../engine/dom/document';

/// A description of a DOM structure. Can be either a string, which is
/// interpreted as a text node, a DOM node, which is interpreted as
/// itself, a `{dom, contentDOM}` object, or an array.
///
/// An array describes a DOM element. The first value in the array
/// should be a string—the name of the DOM element, optionally prefixed
/// by a namespace URL and a space. If the second element is plain
/// object, it is interpreted as a set of attributes for the element.
/// Any elements after that (including the 2nd if it's not an attribute
/// object) are interpreted as children of the DOM elements, and must
/// either be valid `DOMOutputSpec` values, or the number zero.
///
/// The number zero (pronounced “hole”) is used to indicate the place
/// where a node's child nodes should be inserted. If it occurs in an
/// output spec, it should be the only child element in its parent
/// node.
export type DOMOutputSpec = readonly [string, ...any[]]

export class DOMMatcher {
  static matchSpec(
    domIn: DOMNode,
    structure: DOMOutputSpec): {
    dom: DOMNode,
    contentDOM?: HTMLElement
  } {
    let dom = domIn.AsElement()!.AsHTMLElement()!;
    let attrs = (structure as any)[1], start = 1;
    if (attrs && typeof attrs == 'object' && attrs.nodeType == null && !Array.isArray(attrs)) {
      start = 2;
      for (let name in attrs) if (attrs[name] != null) {
        if (name.indexOf(' ') > 0) {
          NOTIMPLEMENTED();
        }

        const toSet = attrs[name];
        if (name === kStyleAttributeName && isObject(toSet)) {
          // console.log(`[pm]set style`, toSet, dom.tagName);
        } else {
          console.log(`[pm]setAttribute`, name, attrs[name], dom.tagName);
        }
      }
    }
    for (let i = start; i < (structure as readonly any[]).length; i++) {
      let child = (structure as any)[i] as DOMOutputSpec | 0;
      if (child === 0) {
        if (i < (structure as readonly any[]).length - 1 || i > start)
          throw new RangeError('Content hole must be the only child of its parent node');
        return { dom, contentDOM: dom };
      } else {
        NOTIMPLEMENTED();
      }
    }
    NOTREACHED();
    // return { dom, contentDOM };
  }
}

export class DOMSerializer {
  /// Render an [output spec](#model.DOMOutputSpec) to a DOM node. If
  /// the spec has a hole (zero) in it, `contentDOM` will point at the
  /// node with the hole.
  static renderSpec(doc: Document, structure: DOMOutputSpec): {
    dom: DOMNode,
    contentDOM?: HTMLElement
  } {
    let tagName = (structure as [string])[0], space = tagName.indexOf(' ');
    if (space > 0) {
      NOTREACHED();
    }
    let contentDOM: HTMLElement | undefined;
    let dom = doc.createElement(tagName) as HTMLElement;
    let attrs = (structure as any)[1], start = 1;
    if (attrs && typeof attrs == 'object' && attrs.nodeType == null && !Array.isArray(attrs)) {
      start = 2;
      for (let name in attrs) if (attrs[name] != null) {
        let space = name.indexOf(' ');
        if (space > 0) {
          NOTREACHED();
        } else {
          if (name === kStyleAttributeName) {
            Object.assign(dom.style, attrs[name]);
          } else {
            dom.setAttribute(name, attrs[name]);
          }
        }
      }
    }
    for (let i = start; i < (structure as readonly any[]).length; i++) {
      let child = (structure as any)[i] as DOMOutputSpec | 0;
      if (child === 0) {
        if (i < (structure as readonly any[]).length - 1 || i > start)
          throw new RangeError('Content hole must be the only child of its parent node');
        return { dom, contentDOM: dom };
      } else {
        let { dom: inner, contentDOM: innerContent } = DOMSerializer.renderSpec(doc, child);
        dom.appendChild(inner);
        if (innerContent) {
          if (contentDOM) throw new RangeError('Multiple content holes');
          contentDOM = innerContent as HTMLElement;
        }
      }
    }
    return { dom, contentDOM };
  }

}
