import { Block } from '../block';
import { evaluate } from '../eval';
import { checkAttr } from '../utils';
import { Context } from '../context';
import { Element } from "../../../../../../engine/dom/element";
import { DLOG, WARNING } from "../../../../../../base/logging";
import { Optional } from "../../../../../../base/common/typescript";
import { Comment } from "../../../../../../engine/dom/comment";

interface Branch {
  exp?: string | null
  el: Element
}

export const _if = (el: Element, exp: string, ctx: Context) => {
  DLOG(WARNING, `v-if expression cannot be empty.`);

  const parent = el.parentElement!;
  const anchor = new Comment('v-if');
  parent.insertBefore(anchor, el);

  const branches: Branch[] = [
    {
      exp,
      el
    }
  ];

  // locate else branch
  let elseEl: Optional<Element>;
  let elseExp: string | null;
  while ((elseEl = el.nextElementSibling)) {
    elseExp = null
    if (
      checkAttr(elseEl, 'v-else') === '' ||
      (elseExp = checkAttr(elseEl, 'v-else-if'))
    ) {
      parent.removeChild(elseEl);
      branches.push({ exp: elseExp, el: elseEl });
    } else {
      break;
    }
  }

  const nextNode = el.nextSibling;
  parent.removeChild(el);

  let block: Block | undefined;
  let activeBranchIndex: number = -1;

  const removeActiveBlock = () => {
    if (block) {
      parent.insertBefore(anchor, block.el);
      block.remove();
      block = undefined;
    }
  };

  ctx.effect(() => {
    for (let i = 0; i < branches.length; i++) {
      const { exp, el } = branches[i];
      if (!exp || evaluate(ctx.scope, exp)) {
        if (i !== activeBranchIndex) {
          removeActiveBlock();
          block = new Block(el, ctx);
          block.insert(parent, anchor);
          parent.removeChild(anchor);
          activeBranchIndex = i;
        }
        return;
      }
    }
    // no matched branch.
    activeBranchIndex = -1;
    removeActiveBlock();
  });

  return nextNode;
};
