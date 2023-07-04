import { Box } from "./box";
import { Node } from "../dom/node";
import { Optional } from "../../base/common/typescript";
import { LayoutTextes } from "./layout_text";

export class LayoutObject {
  constructor(
    public node: Node,
    public box: Box
  ) {
  }

  AsLayoutTexes(): Optional<LayoutTextes> {
    return undefined
  }
}
