import { Node } from './node';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK_GE } from '@neditor/core/base/check_op';
import { DCHECK } from '@neditor/core/base/check';

export class RangeBoundaryPoint {
  private container_node_: Node;
  private child_before_boundary_: Optional<Node>;
  // mutable uint64_t dom_tree_version_;
  offset_in_container_: number;
  constructor(container: Node) {
    this.container_node_ = container;
    this.offset_in_container_ = 0;
  }

  Container() {
    return this.container_node_;
  }
  Offset() {
    return this.offset_in_container_;
  }
  ChildBefore() {
    return this.child_before_boundary_;
  }

  Set(container: Node, offset: number, child_before: Optional<Node>) {
    DCHECK_GE(offset, 0);
    this.container_node_ = container;
    this.offset_in_container_ = offset;
    this.child_before_boundary_ = child_before;
    // this.MarkValid();
  }
  SetOffset(offset: number) {
    DCHECK(this.container_node_);
    // DCHECK(  this.container_node_.IsCharacterDataNode());
    DCHECK_GE(this.offset_in_container_, 0);
    DCHECK(!this.child_before_boundary_);
    this.offset_in_container_ = offset;
    // this.MarkValid();
  }

  EQ(other: RangeBoundaryPoint): boolean {
    return this.child_before_boundary_ === other.child_before_boundary_
      && this.container_node_ === other.container_node_
      && this.offset_in_container_ === other.offset_in_container_;
  }
  CLONE() {
    let ret = new RangeBoundaryPoint(this.container_node_)
    ret.child_before_boundary_ = this.child_before_boundary_
    ret.offset_in_container_ = this.offset_in_container_
    return ret;
  }
}
