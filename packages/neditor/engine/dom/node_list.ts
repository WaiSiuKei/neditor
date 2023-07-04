// A NodeList object is a collection of nodes.
//    https://www.w3.org/TR/2015/WD-dom-20150428/#interface-nodelist
import type { Node } from './node';

export class NodeList implements Record<number, Node | null> {
  [x: number]: Node | null
  protected collection_: Node[] = [];
  Length(): number {return this.collection_.length;}
  get length(): number {return this.Length();}

  Item(item: number): Node | null {
    return this.collection_[item];
  }
  AppendNode(node: Node) {
    this.collection_.push(node);
  }
  Clear() {
    this.collection_.length = 0;
  }
  // custom
  indexOf(item: Node): number {
    return this.collection_.indexOf(item);
  }
  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () => {
        if (index < this.Length()) {
          let value = this.Item(index);
          index++;
          return {
            value,
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true
          };
        }
      }
    };

  }
}
