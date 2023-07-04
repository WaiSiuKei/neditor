// A simple rectangle, filled (without blending) with a specified color.
import { Node } from './node';
import { RectF } from '../math/rect_f';
import { ColorRGBA } from './color_rgba';
import { baseGetTypeId as _GetTypeId } from '../base/type_id';
import { NodeVisitor } from './node_visitor';

class Builder {
  // The destination rectangle.
  rect: RectF;

// The clear color.
  color: ColorRGBA;
  constructor(rect: RectF, color: ColorRGBA) {
    this.rect = rect;
    this.color = color;
  }
}

export class ClearRectNode extends Node {
  private data_: Builder;

  constructor(rect: RectF, color: ColorRGBA) {
    super();
    this.data_ = new Builder(rect, color);
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitClearRectNode(this);
  }
  GetBounds() { return this.data_.rect; }

  GetTypeId(): number {
    return _GetTypeId(ClearRectNode);
  }
  data() { return this.data_; }
}

