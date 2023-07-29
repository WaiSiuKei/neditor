import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';
import { DLOG, ERROR } from '../../../../../base/logging';
import { Element } from '../../../../../engine/dom/element';
import { Node, NodeType } from '../../../../../engine/dom/node';
import { Text } from '../../../../../engine/dom/text';
import { Context, createScopedContext } from './context';
import { builtInDirectives, Directive } from './directives';
import { bind } from './directives/bind';
import { _for } from './directives/for';
import { _if } from './directives/if';
import { text } from './directives/text';
import { evaluate } from './eval';
import { checkAttr } from './utils';

const dirRE = /^(?:v-|:|@)/;
const modifierRE = /\.([\w-]+)/g;

export let inOnce = false;

export const walk = (node: Node, ctx: Context): Node | null | void => {
  const type = node.nodeType;
  if (type === NodeType.kElementNode) {
    // Element

    let exp: string | null;
    let el = node as Element;

    // v-if
    if ((exp = checkAttr(el, 'v-if'))) {
      return _if(el, exp, ctx);
    }

    // v-for
    if ((exp = checkAttr(el, 'v-for'))) {
      return _for(el, exp, ctx);
    }

    // v-scope
    if ((exp = checkAttr(el, 'v-scope')) || exp === '') {
      const scope = exp ? evaluate(ctx.scope, exp) : {};
      ctx = createScopedContext(ctx, scope);
      if (scope.$template) {
        el.appendChild(scope.$template());
      }
    }

    // process children first before self attrs
    walkChildren(el, ctx);

    // other directives
    const deferred: [string, string][] = [];
    for (const [name, value] of [...el.attributes]) {
      if (dirRE.test(name) && name !== 'v-cloak') {
        if (name === 'v-model') {
          // defer v-model since it relies on :value bindings to be processed
          // first, but also before v-on listeners (#73)
          deferred.unshift([name, value]);
        } else if (name[0] === '@' || /^v-on\b/.test(name)) {
          deferred.push([name, value]);
        } else {
          processDirective(el, name, value, ctx);
        }
      }
    }
    for (const [name, value] of deferred) {
      processDirective(el, name, value, ctx);
    }

    // if (hasVOnce) {
    //   inOnce = false;
    // }
  } else if (type === NodeType.kTextNode) {
    const data = (node as Text).data;
    if (data.includes(ctx.delimiters[0])) {
      let segments: string[] = [];
      let lastIndex = 0;
      let match;
      while ((match = ctx.delimitersRE.exec(data))) {
        const leading = data.slice(lastIndex, match.index);
        if (leading) segments.push(JSON.stringify(leading));
        segments.push(`$s(${match[1]})`);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < data.length) {
        segments.push(JSON.stringify(data.slice(lastIndex)));
      }
      applyDirective(node, text, segments.join('+'), ctx);
    }
  }
};

const walkChildren = (node: Element, ctx: Context) => {
  let child = node.firstChild;
  while (child) {
    child = walk(child, ctx) || child.nextSibling;
  }
};

const processDirective = (
  el: Element,
  raw: string,
  exp: string,
  ctx: Context
) => {
  let dir: Directive;
  let arg: string | undefined;
  let modifiers: Record<string, true> | undefined;

  // modifiers
  raw = raw.replace(modifierRE, (_, m) => {
    ;(modifiers || (modifiers = {}))[m] = true;
    return '';
  });

  if (raw[0] === ':') {
    dir = bind;
    arg = raw.slice(1);
  } else {
    const argIndex = raw.indexOf(':');
    const dirName = argIndex > 0 ? raw.slice(2, argIndex) : raw.slice(2);
    dir = builtInDirectives[dirName] || ctx.dirs[dirName];
    arg = argIndex > 0 ? raw.slice(argIndex + 1) : undefined;
  }
  if (dir) {
    if (dir === bind && arg === 'ref') {
      NOTIMPLEMENTED();
    }
    applyDirective(el, dir, exp, ctx, arg, modifiers);
    el.removeAttribute(raw);
  } else {
    DLOG(ERROR, `unknown custom directive ${raw}.`);
  }
};

const applyDirective = (
  el: Node,
  dir: Directive<any>,
  exp: string,
  ctx: Context,
  arg?: string,
  modifiers?: Record<string, true>
) => {
  const get = (e = exp) => evaluate(ctx.scope, e, el);
  const cleanup = dir({
    el,
    get,
    effect: ctx.effect,
    ctx,
    exp,
    arg,
    modifiers
  });
  if (cleanup) {
    ctx.cleanups.push(cleanup);
  }
};
