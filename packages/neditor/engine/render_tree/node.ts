// A base class of all objects that form a render tree.
import type { NodeVisitor } from './node_visitor';
import type { RectF } from '../math/rect_f';
import type { TypeId } from '../base/type_id';
import { Disposable } from "../../base/common/lifecycle";

let id_counter_ = 0;

export abstract class Node extends Disposable {
  node_id_: number;
  constructor() {
    super()
    this.node_id_ = id_counter_++;
  }

  abstract Accept(visitor: NodeVisitor): void
  // Returns an axis-aligned bounding rectangle for this render tree node in
  // units of pixels.
  abstract GetBounds(): RectF

  // Returns an ID that is unique to the node type.  This can be used to
  // polymorphically identify what type a node is.
  abstract GetTypeId(): TypeId

  // Number to help differentiate nodes. This is specific to the local process
  // and is not deterministic. Node identifiers from different processes may
  // overlap. This is intended to be used as a key when, for example, caching
  // render results of nodes.
  GetId(): number {
    return this.node_id_;
  }
}
