import { Rect } from '../../../../base/common/geometry/rect';
import { NodeVisitor } from '../nodeVisitor';
import { IRenderTreeNode } from '../renderTree';

let id_counter_ = 0;

export abstract class RenderTreeNode implements IRenderTreeNode {
  readonly id: number;
  constructor() {
    this.id = id_counter_++;
  }

  abstract accept(visitor: NodeVisitor): void
  // Returns an axis-aligned bounding rectangle for this render tree node in
  // units of pixels.
  abstract getBounds(): Rect
}
