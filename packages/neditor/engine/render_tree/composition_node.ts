// A composition specifies a set of child nodes that are to be rendered in
// order. It is the primary way to compose multiple child nodes together in a
// render tree. This node doesn't have its own intrinsic shape or size, it is
// completely determined by its children.  An offset can be specified to be
// applied to all children of the composition node.
// You would construct a CompositionNode via a CompositionNode::CompositionNodeBuilder object,
// which is essentially a CompositionNode that permits mutations.
// The CompositionNode::CompositionNodeBuilder class can be used to build the constructor
// parameter of the CompositionNode.  This allows mutations (such as adding
// a new child node) to occur within the mutable object, while permitting the
// actual render tree node, CompositionNode, to be immutable.
// Since the CompositionNode::CompositionNodeBuilder can be a heavy-weight object, it provides
// a Pass() method allowing one to specify move semantics when passing it in
// to a CompositionNode constructor.
// For example the following function takes two child render tree nodes and
// returns a CompositionNode that has both of them as children.
//
// scoped_refptr<CompositionNode> ComposeChildren(
//     const scoped_refptr<Node>& child1,
//     const scoped_refptr<Node>& child2) {
//   CompositionNode::CompositionNodeBuilder composition_node_builder;
//   composition_node_builder.AddChild(child1);
//   composition_node_builder.AddChild(child2);
//   return base::WrapRefCounted(new CompositionNode(
//       std::move(composition_node_builder)));
// }
//
import { Node } from './node';
import { Vector2dF } from '../math/vector2d_f';
import { baseGetTypeId as _GetTypeId } from '../base/type_id';
import { DCHECK_GE, DCHECK_LT } from '@neditor/core/base/check_op';
import { RectF } from '../math/rect_f';
import type { NodeVisitor } from './node_visitor';

export type Children = Node[]

export class CompositionNodeBuilder {
  offset_: Vector2dF;
  children_: Children = [];

  constructor()
  constructor(offset: Vector2dF)
  constructor(node: Node, offset: Vector2dF)
  constructor(arg1?: unknown, arg2?: unknown) {
    if (!arguments.length) {
      this.offset_ = new Vector2dF();
    } else if (arguments.length === 1) {
      if (arg1 instanceof Vector2dF) {
        this.offset_ = arg1;
      } else {
        throw new Error('500');
      }
    } else if (arguments.length === 2) {
      this.children_.push(arg1 as Node);
      this.offset_ = arg2 as Vector2dF;
    } else {
      throw new Error('500');
    }
  }

  AddChild(node: Node) {
    this.children_.push(node);
  }

  GetChild(child_index: number): Node {
    DCHECK_GE(child_index, 0);
    DCHECK_LT(child_index, this.children_.length);
    return this.children_[child_index]!;
  }

  children() {
    return this.children_;
  }

  offset() {
    return this.offset_;
  }

  set_offset(offset: Vector2dF) {
    this.offset_ = offset;
  }
}

export class CompositionNode extends Node {
  data_: CompositionNodeBuilder;
  cached_bounds_: RectF;
  disposed = false;

  constructor(builder: CompositionNodeBuilder)
  constructor(node: Node, offset: Vector2dF)
  constructor(arg1: unknown, arg2?: unknown) {
    super();
    if (arg1 instanceof CompositionNodeBuilder) {
      this.data_ = arg1 as CompositionNodeBuilder;
    } else {
      this.data_ = new CompositionNodeBuilder(arg1 as Node, arg2 as Vector2dF);
    }
    this.cached_bounds_ = this.ComputeBounds();
  }

  dispose() {
    super.dispose();
    for (let child of this.data_.children()) {
      child.dispose();
    }
    this.disposed = true;
  }

  GetTypeId(): number {
    return _GetTypeId(CompositionNode);
  }

  data() {
    return this.data_;
  }

  GetBounds() {
    return this.cached_bounds_;
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitCompositionNode(this);
  }
  private ComputeBounds(): RectF {
    let bounds: RectF = new RectF();

    // Take the union of the bounding rectangle for all child nodes, and use that
    // as our bounding rectangle.
    for (let child of this.data_.children()) {
      bounds.Union(child.GetBounds());
    }

    bounds.Offset(this.data_.offset());

    return bounds;
  }
}
