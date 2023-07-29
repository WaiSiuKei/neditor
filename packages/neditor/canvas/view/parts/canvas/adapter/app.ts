import { reactive } from '../../../../../base/common/reactivity';
import { Block } from './block';
import { Directive } from './directives';
import { createContext } from './context';
import { toDisplayString } from './directives/text';
import { Element } from '../../../../../engine/dom/element';

export const createApp = (initialData = {}) => {
  // root context
  const ctx = createContext();
  // global internal helpers
  Object.assign(initialData, {
    $s: toDisplayString,
  });
  ctx.scope = reactive(initialData);

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
