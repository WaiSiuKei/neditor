import { Context, createContext } from './context';
import { walk } from './walk';
import { remove } from '@vue/shared';
import { stop } from '../../../../../base/common/reactivity';
import { Element } from '../../../../../engine/dom/element';
import { Text } from '../../../../../engine/dom/text';
import { Node } from '../../../../../engine/dom/node';
import { Optional } from '../../../../../base/common/typescript';

export class Block {
  template: Element;
  ctx: Context;
  key?: any;
  parentCtx?: Context;

  start?: Text;
  end?: Text;

  get el() {
    return this.start || (this.template as Element);
  }

  constructor(template: Element, parentCtx: Context, isRoot = false) {
    this.template = template;

    if (isRoot) {
      this.ctx = parentCtx;
    } else {
      // create child context
      this.parentCtx = parentCtx;
      parentCtx.blocks.push(this);
      this.ctx = createContext(parentCtx);
    }

    walk(this.template, this.ctx);
  }

  insert(parent: Element, anchor: Optional<Node>) {
    parent.insertBefore(this.template, anchor);
  }

  remove() {
    if (this.parentCtx) {
      remove(this.parentCtx.blocks, this);
    }
    if (this.start) {
      const parent = this.start.parentNode!;
      let node: Optional<Node> = this.start;
      let next: Optional<Node>;
      while (node) {
        next = node.nextSibling;
        parent.removeChild(node);
        if (node === this.end) break;
        node = next;
      }
    } else {
      if (!this.template.parentNode && Reflect.has(this.template, 'pmViewDesc')) {
        // 应该被prosemirror移除了
      } else {
        this.template.parentNode?.removeChild(this.template);
      }
    }
    this.teardown();
  }

  teardown() {
    this.ctx.blocks.forEach((child) => {
      child.teardown();
    });
    this.ctx.effects.forEach(stop);
    this.ctx.cleanups.forEach((fn) => fn());
  }
}
