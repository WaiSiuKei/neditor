import { IIdentifier } from '../../common/record/common';
import { Element } from '../../engine/dom/element';
import { Scope, ScopedIdentifier } from '../canvasCommon/scope';
import { Optional } from '../../base/common/typescript';

export enum ComponentTypes {
  TrailingBreak = 'TrailingBreak'
}

export const AttrNameOfId = 'id' as const;
export const AttrNameOfScope = 'data-scope' as const;
export const AttrNameOfRoot = 'data-root' as const;
export const AttrNameOfComponentType = 'data-com-type' as const;

export interface IElementPathData {
  id: string;
  scope: Scope;
}

export function getScopeAttr(e: Element): string {
  return e.getAttribute(AttrNameOfScope) || '';
}

export function getRootAttr(e: Element): string {
  return e.getAttribute(AttrNameOfRoot) || '';
}

// export function getTypeAttr(e: Element): NodeType {
//   const t = e.getAttribute(AttrNameOfComponentType);
//   DCHECK(t);
//   return t as unknown as NodeType;
// }

export function isFragmentRoot(e: Element): boolean {
  return !!getRootAttr(e);
}

export function getIDAttr(e: Element): IIdentifier {
  return e.getAttribute(AttrNameOfId) || '';
}

export function getScope(el: Element): Scope {
  const path = getScopeAttr(el).split('/');
  if (isFragmentRoot(el)) {
    const childScope = getIDAttr(el);
    path.push(childScope);
  }

  return Scope.fromFullPath(path);
}

export function getScopedIdentifier(el: Element): ScopedIdentifier {
  return ScopedIdentifier.create(getIDAttr(el), getScope(el));
}

export function collect(target: Element): IElementPathData[] {
  let node: Optional<Element> = target;
  const result: IElementPathData[] = [];
  let resultLen = 0;

  while (node) {
    const meta: IElementPathData = Object.create(null);
    if (node.hasAttribute(AttrNameOfId)) {
      const fragmentRoot = getRootAttr(node);
      if (fragmentRoot) {
        meta.id = fragmentRoot;
      } else {
        meta.id = getIDAttr(node);
      }
      meta.scope = getScope(node);
      result[resultLen++] = meta;
    }

    if (node.tagName === 'BODY') {
      break;
    }
    node = node.parentElement;
  }

  return result.reverse();
}
