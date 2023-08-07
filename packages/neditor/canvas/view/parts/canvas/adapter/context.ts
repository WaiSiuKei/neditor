import {
  effect as rawEffect,
  reactive,
  ReactiveEffectRunner
} from '@vue/reactivity';
import { hasOwn } from '@vue/shared';
import { Block } from './block';
import { Directive } from './directives';
import { queueJob } from './scheduler';
import { inOnce } from './walk';

export interface Context {
  key?: any;
  scope: Record<string, any>;
  dirs: Record<string, Directive>;
  blocks: Block[];
  effect: typeof rawEffect;
  effects: ReactiveEffectRunner[];
  cleanups: (() => void)[];
  delimiters: [string, string];
  delimitersRE: RegExp;
}

export const createContext = (parent?: Context): Context => {
  const ctx: Context = {
    ...parent,
    scope: parent ? parent.scope : reactive({}),
    dirs: parent ? parent.dirs : {},
    effects: [],
    blocks: [],
    cleanups: [],
    delimiters: ['{{', '}}'],
    delimitersRE: /\{\{([^]+?)\}\}/g,
    effect: (fn) => {
      if (inOnce) {
        queueJob(fn);
        return fn as any;
      }
      const e: ReactiveEffectRunner = rawEffect(fn, {
        scheduler: () => queueJob(e)
      });
      ctx.effects.push(e);
      return e;
    }
  };
  return ctx;
};

export const createScopedContext = (ctx: Context, data = {}): Context => {
  const parentScope = ctx.scope;
  const mergedScope = Object.create(parentScope);
  Object.defineProperties(mergedScope, Object.getOwnPropertyDescriptors(data));
  const reactiveProxy = reactive(
    new Proxy(mergedScope, {
      set(target, key, val, receiver) {
        // when setting a property that doesn't exist on current scope,
        // do not create it on the current scope and fallback to parent scope.

        if (receiver === reactiveProxy && !hasOwn(target, key)) {
          return Reflect.set(parentScope, key, val);
        }
        return Reflect.set(target, key, val, receiver);
      }
    })
  );

  return {
    ...ctx,
    scope: reactiveProxy
  };
};

