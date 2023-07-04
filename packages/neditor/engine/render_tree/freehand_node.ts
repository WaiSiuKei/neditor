import { Node } from './node';
import { NodeVisitor } from './node_visitor';
import { RectF } from '../math/rect_f';
import { baseGetTypeId } from '../base/type_id';
import { Path } from "./path";

export class FreehandNode extends Node {
  constructor(path: Path) {
    super();
    // @ts-ignore
    this.data_ = path;
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitFreehandNode(this);
  }

  GetBounds(): RectF {
    return new RectF();
  }

  GetTypeId() {
    return baseGetTypeId(FreehandNode);
  }

  data() {
    return this.data_;
  }

  private data_: Path;
};
