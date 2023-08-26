import {
  Ancestor,
  Descendant,
  ExtendedType,
  Node,
  Path
} from '..';
import { isFunction } from '../../../../../../base/common/type';

/**
 * `Element` objects are a type of node in a Slate document that contain other
 * element nodes or text nodes. They can be either "blocks" or "inlines"
 * depending on the Slate editor's configuration.
 */

export interface BaseElement {
  readonly _newOnlyBrand: void;
  readonly children: readonly Descendant[];
}

export type Element = ExtendedType<'Element', BaseElement>
export type ElementInit = Omit<Element, '_newOnlyBrand'>

export interface ElementInterface {
  /**
   * Check if a value implements the 'Ancestor' interface.
   */
  isAncestor: (value: any) => value is Ancestor;

  /**
   * Check if a value implements the `Element` interface.
   */
  isElement: (value: any) => value is Element;

  isElementInit: (value: any) => value is ElementInit;

  /**
   * Check if a value is an array of `Element` objects.
   */
  isElementList: (value: any) => value is Element[];

  /**
   * Check if a set of props is a partial of Element.
   */
  isElementProps: (props: any) => props is Partial<Element>;

  /**
   * Check if a value implements the `Element` interface and has elementKey with selected value.
   * Default it check to `type` key value
   */
  // isElementType: <T extends Element>(
  //   value: any,
  //   elementVal: string,
  //   elementKey?: string
  // ) => value is T;

  /**
   * Check if an element matches set of properties.
   *
   * Note: this checks custom properties, and it does not ensure that any
   * children are equivalent.
   */
  matches: (element: Element, props: Partial<Element>) => boolean;
}

/**
 * Shared the function with isElementType utility
 */
const isElement = (value: any): value is Element => {
  const func = Reflect.get(value, 'isBlock');
  return func && isFunction(func) && func.call(value);
};

// eslint-disable-next-line no-redeclare
export const Element: ElementInterface = {
  isAncestor(value: any): value is Ancestor {
    return Reflect.has(value, 'children') && Node.isNodeList(value.children);
  },

  isElement,

  isElementInit(value: any): value is ElementInit {
    return !isElement(value) && Reflect.get(value, '_blockBrand');
  },

  isElementList(value: any): value is Element[] {
    return Array.isArray(value) && value.every(val => Element.isElement(val));
  },

  isElementProps(props: any): props is Partial<Element> {
    return (props as Partial<Element>).children !== undefined;
  },

  // isElementType: <T extends Element>(
  //   value: any,
  //   elementVal: string,
  //   elementKey: string = 'type'
  // ): value is T => {
  //   return isElement(value) && value[elementKey] === elementVal;
  // },

  matches(element: Element, props: Partial<Element>): boolean {
    for (const k in props) {
      let key = k as keyof Element;
      if (key === 'children') {
        continue;
      }

      if (element[key] !== props[key]) {
        return false;
      }
    }

    return true;
  },
};

/**
 * `ElementEntry` objects refer to an `Element` and the `Path` where it can be
 * found inside a root node.
 */
export type ElementEntry = [Element, Path]
