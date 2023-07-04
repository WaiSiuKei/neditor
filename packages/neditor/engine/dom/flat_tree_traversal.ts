import { Ptr } from '@neditor/core/base/common/typescript';
import { Node } from './node';
import { ContainerNode } from './container_node';

export enum TraversalDirection {
  kTraversalDirectionForward,
  kTraversalDirectionBackward
};

export class FlatTreeTraversal {

  static AssertPrecondition(node: Node) {
    // DCHECK(!node.GetDocument().IsFlatTreeTraversalForbidden());
    // DCHECK(!node.IsShadowRoot());
  }

  static AssertPostcondition(node: Ptr<Node>) {

  }
  static NextSibling(node: Node): Ptr<Node> {
    FlatTreeTraversal.AssertPrecondition(node);
    let result = FlatTreeTraversal.TraverseSiblings(node, TraversalDirection.kTraversalDirectionForward);
    FlatTreeTraversal.AssertPostcondition(result);
    return result;
  }

  static TraverseSiblings(node: Node,
                          direction: TraversalDirection): Ptr<Node> {
    // if (node.IsChildOfShadowHost())
    //   return TraverseSiblingsForHostChild(node, direction);

    return direction == TraversalDirection.kTraversalDirectionForward ? node.nextSibling
      : node.previousSibling;
  }

  static Parent(node: Node): Ptr<ContainerNode> {
    FlatTreeTraversal.AssertPrecondition(node);
    let result = FlatTreeTraversal.TraverseParent(node);
    FlatTreeTraversal.AssertPostcondition(result);
    return result;
  }

  static TraverseParent(node: Node): Ptr<ContainerNode> {
    // TODO(hayato): Stop this hack for a pseudo element because a pseudo element
    // is not a child of its parentOrShadowHostNode() in a flat tree.
    // if (node.IsPseudoElement())
    // return node.ParentOrShadowHostNode();

    // if (node.IsChildOfShadowHost())
    // return node.AssignedSlot();

    // let parent_slot =
    //   ToHTMLSlotElementIfSupportsAssignmentOrNull(node.parentElement);
    // if (parent_slot) {
    //   if (!parent_slot.AssignedNodes().IsEmpty())
    //     return undefined;
    //   return parent_slot;
    // }
    return FlatTreeTraversal.TraverseParentOrHost(node);
  }

  static TraverseParentOrHost(node: Node): Ptr<ContainerNode> {
    let parent = node.parentNode;
    if (!parent)
      return undefined;
    // auto* shadow_root = DynamicTo<ShadowRoot>(parent);
    // if (!shadow_root)
    return parent;
    // return &shadow_root.host();
  }

  static FirstChild(node: Node): Ptr<Node> {
    FlatTreeTraversal.AssertPrecondition(node);
    let result = FlatTreeTraversal.TraverseChild(node, TraversalDirection.kTraversalDirectionForward);
    FlatTreeTraversal.AssertPostcondition(result);
    return result;
  }

  static TraverseChild(node: Node,
                       direction: TraversalDirection): Ptr<Node> {
    // if (auto* slot = ToHTMLSlotElementIfSupportsAssignmentOrNull(node)) {
    //   if (slot.AssignedNodes().IsEmpty()) {
    //   return direction == kTraversalDirectionForward ? slot.firstChild()
    //     : slot.lastChild();
    //
    //   return direction == kTraversalDirectionForward ? slot.FirstAssignedNode()
    //     : slot.LastAssignedNode();
    // }
    let child: Ptr<Node>;
// if (ShadowRoot* shadow_root = node.GetShadowRoot()) {
//   child = direction == kTraversalDirectionForward ? shadow_root.firstChild()
//     : shadow_root.lastChild();
// } else {
    child = direction == TraversalDirection.kTraversalDirectionForward ? node.firstChild
      : node.lastChild;
// }
    return child;
  }
}
