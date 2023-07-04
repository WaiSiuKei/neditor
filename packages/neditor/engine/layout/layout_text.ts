import { LayoutObject } from "./layout_object";
import { TextBox } from "./text_box";
import { Box } from "./box";
import { Node } from "../dom/node";

export class LayoutTextes extends LayoutObject {
  children: TextBox[] = []
  constructor(node: Node, box: TextBox) {
    super(node, box);
    this.children.push(box)
  }
  AsLayoutTexes() {
    return this;
  }
  Append(box: TextBox) {
    this.children.push(box)
  }
}
