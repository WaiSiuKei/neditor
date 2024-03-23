import { Matrix3 } from '../../../../base/common/geometry/matrix3';
import { Quad } from '../../../../base/common/geometry/quad';
import { NodeVisitor } from '../nodeVisitor';
import { RenderTreeNode } from './baseNode';

export class MatrixTransformNodeBuilder {
  // The subtree that will be rendered with |transform| applied to it.
  source: RenderTreeNode;

  // The matrix transform that will be applied to the subtree.  It is an
  // affine 3x3 matrix to be applied to 2D points.
  transform: Matrix3;
  constructor(
    source: RenderTreeNode,
    transform: Matrix3
  ) {
    this.source = source;
    this.transform = transform.CLONE();
  }

  EQ(other: MatrixTransformNodeBuilder): boolean {
    return this.source == other.source && this.transform.EQ(other.transform);
  }
};

// A MatrixTransformNode applies a specified affine matrix transform,
// |transform| to a specified sub render tree node, |source|.
export class MatrixTransformNode extends RenderTreeNode {
  private data_: MatrixTransformNodeBuilder;

  // Forwarding constructor to the set of Builder constructors.
  constructor(
    source: RenderTreeNode,
    transform: Matrix3
  ) {
    super();
    this.data_ = new MatrixTransformNodeBuilder(source, transform);
  }

  accept(visitor: NodeVisitor) {
    visitor.VisitMatrixTransformNode(this);
  }
  getBounds() {
    return Quad.FromMatrix3AndRect(this.data_.transform, this.data_.source.getBounds()).BoundingBox();
  }

  data() { return this.data_; }
}

