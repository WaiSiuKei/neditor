import { Rect } from '../../../../base/common/geometry/rect';
import { ColorRGBA } from '../components/colorRgba';
import { NodeVisitor } from '../nodeVisitor';

class Builder {
  // The destination rectangle.
  rect: Rect;

  color: ColorRGBA;
  constructor(rect: Rect,
              color: ColorRGBA) {
    this.rect = rect;
    this.color = color;
  }
}

export class ClearRectNode extends Node {
  private data_: Builder;

  constructor(rect: Rect,
              color: ColorRGBA) {
    super();
    this.data_ = new Builder(rect, color);
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitClearRectNode(this);
  }
  GetBounds() { return this.data_.rect; }

  data() { return this.data_; }
}

