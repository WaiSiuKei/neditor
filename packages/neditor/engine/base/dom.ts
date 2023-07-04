import { Node } from '../dom/node';
import { Optional } from '@neditor/core/base/common/typescript';

export function isAncestor(testChild: Optional<Node>, testAncestor: Node): boolean {
  while (testChild) {
    if (testChild === testAncestor) {
      return true;
    }
    testChild = testChild.parentNode;
  }

  return false;
}
