import { Element } from '../../engine/dom/element';
import { Scope } from '../canvasCommon/scope';
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

export function getScopeAttr(e: Element) {
  return e.getAttribute(AttrNameOfScope) || '';
}

export function getRootAttr(e: Element): string {
  return e.getAttribute(AttrNameOfRoot) || '';
}

export function isFragmentRoot(e: Element) {
  return !!getRootAttr(e);
}

export function getIDAttr(e: Element) {
  return e.getAttribute(AttrNameOfId) || '';
}

export function getScope(el: Element) {
  const path = getScopeAttr(el).split('/');
  if (isFragmentRoot(el)) {
    const childScope = getIDAttr(el);
    path.push(childScope);
  }

  return Scope.fromFullPath(path);
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
