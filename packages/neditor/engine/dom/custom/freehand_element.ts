import type { Document } from '../document';
import { HTMLElement } from '../html_element';
import { NodeVisitor } from "../node";
import { Path } from "../../render_tree/path";
import { ColorRGBA } from "../../render_tree/color_rgba";
import { Color } from "../../../base/common/color";
import { Optional } from "../../../base/common/typescript";

export class FreehandElement extends HTMLElement {
  static kTagName = 'x-freehand';
  constructor()
  constructor(document: Document)
  constructor(document?: Document) {
    if (document) {
      super(document, FreehandElement.kTagName);
    } else {
      super(FreehandElement.kTagName);
    }
  }

  AsFreehandElement() {
    return this;
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitElement(this);
  }


  GetPath(): Path {
    const d = this.getAttribute('d') ?? '';
    const fill = this.getAttribute('fill')
    const stroke = this.getAttribute('stroke')
    let fillColor: Optional<ColorRGBA> = undefined;
    let strokeColor: Optional<ColorRGBA> = undefined;
    if (fill) {
      const hex = Color.fromHex(fill)
      if (hex) {
        const rgba = hex.rgba;
        fillColor = new ColorRGBA(rgba.r, rgba.g, rgba.b, rgba.a)
      }
    }
    if (stroke) {
      const hex = Color.fromHex(stroke)
      if (hex) {
        const rgba = hex.rgba;
        strokeColor = new ColorRGBA(rgba.r, rgba.g, rgba.b, rgba.a)
      }
    }
    return new Path(
      d,
      fillColor,
      strokeColor,
    )
  }
}
