import { Optional } from '@neditor/core/base/common/typescript';
import { Node } from './node';
import { ContainerNode } from './container_node';
import { TraversalAncestorRange, TraversalSiblingRange } from './traversal_range';

export class NodeTraversal {
  static FirstChild(parent: Node): Optional<Node> { return parent.firstChild; }
  static LastChild(parent: Node) { return parent.lastChild; }
  static NextSibling(node: Node): Optional<Node> { return node.nextSibling; }
  static PreviousSibling(node: Node) {
    return node.previousSibling;
  }
  static Parent(node: Node): Optional<ContainerNode> { return node.parentNode?.AsContainerNode(); }
  static ChildrenOf(parent: Node) {
    return TraversalSiblingRange(NodeTraversal.FirstChild(parent));
  }
  static AncestorsOf(node: Node) {
    return TraversalAncestorRange(NodeTraversal.Parent(node));
  }

  static CommonAncestor(node_a: Node, node_b: Node): Optional<Node> {
    if (!node_a || !node_b)
      return undefined;
    return node_a.CommonAncestor(node_b);
  }

  static ChildAt(parent: Node, index: number): Optional<Node> {
    let child = parent.firstChild;
    while (child && index--)
      child = child.nextSibling;
    return child;
  }
}
