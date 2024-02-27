import { Rect } from '../../../../base/common/geometry/rect';
import { Disposable } from '../../../../base/common/lifecycle';
import { NodeVisitor } from '../nodeVisitor';

let id_counter_ = 0;

export abstract class RenderTreeNode extends Disposable {
  readonly id: number;
  constructor() {
    super();
    this.id = id_counter_++;
  }

  abstract Accept(visitor: NodeVisitor): void
  // Returns an axis-aligned bounding rectangle for this render tree node in
  // units of pixels.
  abstract GetBounds(): Rect
}
