import { Optional } from '../../base/common/typescript';
import { Node } from './node';
import { assertIsDefined } from "../../base/common/type";

export function TraversalSiblingRange(node: Optional<Node>) {
  return {
    [Symbol.iterator]() {
      let n: Optional<Node> = node;
      return {
        next() {
          if (n) {
            let value = n;
            n = n.nextSibling;
            return {
              value: assertIsDefined(value),
              done: false,
            };
          } else {
            return {
              done: true
            };
          }
        }
      };

    }
  };
}

export function TraversalAncestorRange(node: Optional<Node>) {
  return {
    [Symbol.iterator]() {
      let n: Optional<Node> = node;
      return {
        next() {
          if (n) {
            let value = n;
            n = n.parentNode;
            return {
              value,
              done: false,
            };
          } else {
            return {
              value: undefined,
              done: true,
            };
          }
        }
      };
    }
  };
}
