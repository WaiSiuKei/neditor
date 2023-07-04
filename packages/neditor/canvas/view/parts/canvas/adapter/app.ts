import { reactive } from '@vue/reactivity';
import { Block } from './block';
import { Directive } from './directives';
import { createContext } from './context';
import { toDisplayString } from './directives/text';
import { nextTick } from './scheduler';
import { Element } from '../../../../../engine/dom/element';

// const escapeRegex = (str: string) =>
//   str.replace(/[-.*+?^${}()|[\]\/\\]/g, '\\$&');

export const createApp = (initialData?: any) => {
  // root context
  const ctx = createContext();
  if (initialData) {
    ctx.scope = reactive(initialData);
  }

  // global internal helpers
  ctx.scope.$s = toDisplayString;
  ctx.scope.$nextTick = nextTick;
  ctx.scope.$refs = Object.create(null);

  let rootBlocks: Block[];

  return {
    directive(name: string, def?: Directive) {
      if (def) {
        ctx.dirs[name] = def;
        return this;
      } else {
        return ctx.dirs[name];
      }
    },

    mount(el: Element) {
      let roots = [el];
      rootBlocks = roots.map((el) => new Block(el, ctx, true));
      return this;
    },

    unmount() {
      rootBlocks.forEach((block) => block.teardown());
    }
  };
};
