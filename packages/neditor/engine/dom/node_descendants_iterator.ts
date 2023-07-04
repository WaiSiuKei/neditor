import type { Node } from './node';
import { Optional } from '@neditor/core/base/common/typescript';

export class NodeDescendantsIterator {
  base_: Node;
  current_: Optional<Node>;
  constructor(base: Node) {
    this.base_ = base;
  }

  First(): Optional<Node> {
    this.current_ = this.base_.firstChild
    return this.current_;
  }

  Next(): Optional<Node> {
    if (!this.current_) {
      return undefined;
    }
    if (this.current_.firstChild) {
      // Walk down and use the first child.
      this.current_ = this.current_.firstChild
    } else {
      // Walk towards the next sibling if one exists.
      // If one doesn't exist, walk up and look for a node (that is not a root)
      // with a sibling and continue the iteration from there.
      while (!this.current_!.next_sibling()) {
        this.current_ = this.current_!.parentNode;
        if (this.current_ === this.base_) {
          this.current_ = undefined;
          return this.current_;
        }
      }
      this.current_ = this.current_!.next_sibling();
    }
    return this.current_;
  }
}
