// Iterates over the first-level children of the given node.
import type { Node } from './node';
import { Optional } from '@neditor/core/base/common/typescript';

export class NodeChildrenIterator {
  parent_: Node;
  current_: Optional<Node>;
  constructor(parent: Node) {
    this.parent_ = parent;
  }

  First(): Optional<Node> {
    this.current_ = this.parent_.firstChild
    return this.current_;
  }

  Next(): Optional<Node> {
    if (this.current_) {
      this.current_ = this.current_.next_sibling();
    }
    return this.current_;
  }
}
