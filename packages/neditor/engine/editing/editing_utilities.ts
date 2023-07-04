import { DCHECK_EQ, DCHECK_NE } from '../../base/check_op';
import { Node } from '../dom/node';
import { DCHECK } from '@neditor/core/base/check';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { NodeTraversal } from '../dom/node_traversal';
import { Optional } from '@neditor/core/base/common/typescript';
import { assertIsDefined } from '@neditor/core/base/common/type';

export function ComparePositionsInDOMTree(container_a: Node,
                                          offset_a: number,
                                          container_b: Node,
                                          offset_b: number) {
  return ComparePositions(container_a, offset_a, container_b,
    offset_b);
}

const kAIsBeforeB = -1;
const kAIsEqualToB = 0;
const kAIsAfterB = 1;

export function ComparePositions(container_a: Node,
                                 offset_a: number,
                                 container_b: Node,
                                 offset_b: number): number {
  DCHECK(container_a);
  DCHECK(container_b);

  // if (disconnected)
  //   *disconnected = false;

  if (!container_a)
    return kAIsBeforeB;
  if (!container_b)
    return kAIsAfterB;

  // see DOM2 traversal & range section 2.5

  // case 1: both points have the same container
  // Case 1: both points have the same container
  if (container_a == container_b)
    return CompareNodesInSameParent(offset_a, offset_b);

  // Case 2: node C (container B or an ancestor) is a child node of A, e.g.
  //  * A < B
  //      `<a>...A...<c2>...<b>...B...</b>...</c2>...</a>`
  //  * A > B
  //      `<a>...<c2>...<b>...B...</b>...</c2>...A...</a>`
  //  * A == C2
  //             A
  //      `<a>...<c2>...<b>...B...</b>...</c2>...</a>`
  {
    let node_c2 = FindChildInAncestors(container_b, container_a);
    if (node_c2) {
      return CompareNodesInSameParent2(offset_a, NodeTraversal.PreviousSibling(node_c2), kAIsBeforeB);
    }
  }

  // Case 3: node C (container A or an ancestor) is a child node of B, e.g.
  //  * B < A
  //      `<b>...B....<c3>...<a>...A...</a>...</b>`
  //  * B > A
  //      `<b>...<c3>...<a>...A...</a>...</c3>...B...</b>`
  //  * B == C3
  //             B
  //      `<b>...<c3>...<a>...A...</a>...</b>`
  {
    let node_c3 = FindChildInAncestors(container_a, container_b);
    if (node_c3) {
      return -CompareNodesInSameParent2(offset_b, NodeTraversal.PreviousSibling(node_c3), kAIsBeforeB);
    }
  }

  // case 4: containers A & B are siblings, or children of siblings
  // ### we need to do a traversal here instead
  let common_ancestor = NodeTraversal.CommonAncestor(container_a, container_b);
  if (!common_ancestor) {
    // if (disconnected)
    //   *disconnected = true;
    return kAIsEqualToB;
  }

  const child_a = FindChildInAncestors(container_a, common_ancestor);
  const adjusted_child_a = child_a ? child_a : NodeTraversal.LastChild(common_ancestor);
  const child_b = FindChildInAncestors(container_b, common_ancestor);
  const adjusted_child_b = child_b ? child_b : NodeTraversal.LastChild(common_ancestor);
  return CompareNodesInSameParent3(adjusted_child_a, adjusted_child_b);
}

export function CompareNodesInSameParent(
  offset_a: number,
  offset_b: number,
  result_of_a_is_equal_to_b = kAIsEqualToB) {
  if (offset_a == offset_b)
    return result_of_a_is_equal_to_b;
  return offset_a < offset_b ? kAIsBeforeB : kAIsAfterB;
}

// Returns
//  -1 if `offset_a < offset_b`
//   0 if `offset_a == offset_b`
//   1 if `offset_a > offset_b`
//     where ```
//        offset_b =  child_before_position_b
//            ? Traversal::Index(*child_before_position_b) + 1
//            : 0 ```
// The number of iteration is `std::min(offset_a, offset_b)`.
function CompareNodesInSameParent2(
  offset_a: number,
  child_before_position_b: Optional<Node>,
  result_of_a_is_equal_to_b = kAIsEqualToB) {
  if (!child_before_position_b)
    return !offset_a ? result_of_a_is_equal_to_b : kAIsAfterB;
  if (!offset_a)
    return kAIsBeforeB;
  // Starts from offset 1 and after `child_before_position_b`.
  let child_b = child_before_position_b;
  let offset = 1;
  for (let child of NodeTraversal.ChildrenOf(assertIsDefined(NodeTraversal.Parent(child_b)))) {
    if (offset_a == offset)
      return child == child_b ? result_of_a_is_equal_to_b : kAIsBeforeB;
    if (child == child_b)
      return kAIsAfterB;
    ++offset;
  }
  NOTREACHED();
  return result_of_a_is_equal_to_b;
}

// Returns
//  -1 if `Traversal::Index(*child_a) < Traversal::Index(*child_b)`
//   0 if `Traversal::Index(*child_a) == Traversal::Index(*child_b)`
//   1 if `Traversal::Index(*child_a) > Traversal::Index(*child_b)`
//  `child_a` and `child_b` should be in a same parent nod or `nullptr`.
//
//  When `child_a` < `child_b`. ```
//                   child_a                           child_b
///   <-- backward_a --|-- forward_a --><-- backward_b --|-- forward_b -->
//  |------------------+---------------------------------+----------------|
//  ```
//  When `child_a` > `child_b`. ```
//                   child_b                           child_a
///   <-- backward_b --|-- forward_b --><-- backward_a --|-- forward_a -->
//  |------------------+---------------------------------+----------------|
//  ```
//
//  The number of iterations is: ```
//    std::min(offset_a, offset_b,
//             abs(offset_a - offset_b) / 2,
//             number_of_children - offset_a,
//             number_of_children - offset_b)
//  where
//    `offset_a` == `Traversal::Index(*child_a)`
//    `offset_b` == `Traversal::Index(*child_b)`
//
//  ```
// Note: this number can't exceed `number_of_children / 4`.
//
// Note: We call this function both "node before position" and "node after
// position" cases. For "node after position" case, `child_a` and `child_b`
// should not be `nullptr`.
function CompareNodesInSameParent3(child_a: Optional<Node>, child_b: Optional<Node>, result_of_a_is_equal_to_b = kAIsEqualToB) {
  if (child_a == child_b)
    return result_of_a_is_equal_to_b;
  if (!child_a)
    return kAIsBeforeB;
  if (!child_b)
    return kAIsAfterB;
  DCHECK_EQ(NodeTraversal.Parent(child_a), NodeTraversal.Parent(child_b));
  let backward_a: Optional<Node> = child_a;
  let forward_a: Optional<Node> = child_a;
  let backward_b: Optional<Node> = child_b;
  let forward_b: Optional<Node> = child_b;

  for (; ;) {
    backward_a = NodeTraversal.PreviousSibling(backward_a);
    if (!backward_a)
      return kAIsBeforeB;
    if (backward_a == forward_b)
      return kAIsAfterB;

    forward_a = NodeTraversal.NextSibling(forward_a);
    if (!forward_a)
      return kAIsAfterB;
    if (forward_a == backward_b)
      return kAIsBeforeB;

    backward_b = NodeTraversal.PreviousSibling(backward_b);
    if (!backward_b)
      return kAIsAfterB;
    if (forward_a == backward_b)
      return kAIsBeforeB;

    forward_b = NodeTraversal.NextSibling(forward_b);
    if (!forward_b)
      return kAIsBeforeB;
    if (backward_a == forward_b)
      return kAIsAfterB;
  }

  NOTREACHED();
  return result_of_a_is_equal_to_b;
}

// Returns the child node in `parent` if `parent` is one of inclusive
// ancestors of `node`, otherwise `nullptr`.
// See https://dom.spec.whatwg.org/#boundary-points
function FindChildInAncestors(node: Node,
                              parent: Node): Optional<Node> {
  DCHECK_NE(node, parent);
  let candidate: Optional<Node> = node;
  for (let child of NodeTraversal.AncestorsOf(node)) {
    if (child == parent)
      return candidate;
    candidate = child;
  }
  return undefined;
}
