import { Rect } from '../../../../base/common/geometry/rect';
import { ColorRGBA } from '../components/colorRgba';
import { NodeVisitor } from '../nodeVisitor';
import { RenderTreeNode } from './baseNode';

class ClearRectNodeBuilder {
  // The destination rectangle.
  rect: Rect;

  color: ColorRGBA;
  constructor(rect: Rect,
              color: ColorRGBA) {
    this.rect = rect;
    this.color = color;
  }
}

export class ClearRectNode extends RenderTreeNode {
  private data_: ClearRectNodeBuilder;

  constructor(rect: Rect,
              color: ColorRGBA) {
    super();
    this.data_ = new ClearRectNodeBuilder(rect, color);
  }

  accept(visitor: NodeVisitor) {
    visitor.VisitClearRectNode(this);
  }
  getBounds() { return this.data_.rect; }

  data() { return this.data_; }
}

