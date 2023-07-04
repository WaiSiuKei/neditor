// A NodeListLive is a live NodeList, which is a collection of nodes.
//    https://www.w3.org/TR/2015/WD-dom-20150428/#interface-nodelist
import { NodeList } from './node_list';
import { DCHECK } from '@neditor/core/base/check';
import type { Node } from './node';
import { NodeGeneration } from './node';
import { NodeChildrenIterator } from './node_children_iterator';
import { isString } from '@neditor/core/base/common/type';

export class NodeListLive extends NodeList {
  // Create a live collection of all first-level child nodes.
  static CreateWithChildren(base: Node): NodeListLive {
    DCHECK(base);

    return new Proxy(new NodeListLive(base), {
      get: function (target, prop, receiver) {
        if (isString(prop)) {
          let int = parseInt(prop);
          if (!Number.isNaN(int)) {
            return target.Item(int);
          }
        }
        return Reflect.get(target, prop);
      }
    });
  }

  base_: Node;
  base_node_generation_: number;
  constructor(base: Node) {
    super();
    this.base_ = base;
    this.base_node_generation_ = NodeGeneration.kInvalidNodeGeneration;
  }

  Length(): number {
    this.MaybeRefreshCollection();
    return super.Length();
  }

  get length(): number {
    this.MaybeRefreshCollection();
    return super.length;
  }

  Item(item: number): Node | null {
    this.MaybeRefreshCollection();
    return super.Item(item);
  }

  private MaybeRefreshCollection() {
    if (this.base_node_generation_ != this.base_.node_generation()) {
      this.Clear();

      // The allocations caused by |AppendNode| below show up as hot in
      // profiles.  In order to mitigate this, we do an initial traversal to
      // figure out how many nodes we plan on appending, reserve, and then
      // append.
      let iterator = new NodeChildrenIterator(this.base_);
      // let child: Node | null = iterator.First();
      // let pending_append_count = 0;
      // while (child) {
      //   pending_append_count++;
      //   child = iterator.Next();
      // }
      // ReserveForInternalCollection(pending_append_count);
      let child = iterator.First();
      while (child) {
        this.AppendNode(child);
        child = iterator.Next();
      }

      this.base_node_generation_ = this.base_.node_generation();
    }
  }
}
