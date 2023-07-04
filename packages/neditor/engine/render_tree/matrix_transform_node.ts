import { Node } from './node';
import { Matrix3F } from '../math/matrix3_f';
import { NodeVisitor } from './node_visitor';
import { baseGetTypeId } from '../base/type_id';
import { QuadF } from '../math/quad_f';

export class MatrixTransformNodeBuilder {

  // The subtree that will be rendered with |transform| applied to it.
  source: Node;

  // The matrix transform that will be applied to the subtree.  It is an
  // affine 3x3 matrix to be applied to 2D points.
  transform: Matrix3F;
  constructor(
    source: Node,
    transform: Matrix3F
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
export class MatrixTransformNode extends Node {
  private data_: MatrixTransformNodeBuilder;

  // Forwarding constructor to the set of Builder constructors.
  constructor(
    source: Node,
    transform: Matrix3F
  ) {
    super();
    this.data_ = new MatrixTransformNodeBuilder(source, transform);
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitMatrixTransformNode(this);
  }
  GetBounds() {
    return QuadF.FromMatrix3FAndRectF(this.data_.transform, this.data_.source.GetBounds()).BoundingBox();

  }

  GetTypeId() {
    return baseGetTypeId(MatrixTransformNode);
  }

  data() { return this.data_; }
};
