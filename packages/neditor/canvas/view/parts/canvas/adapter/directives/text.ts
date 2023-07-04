import { isObject } from '@vue/shared';
import { Directive } from '.';
import { Text } from '../../../../../../engine/dom/text';
import { Element } from '../../../../../../engine/dom/element';
import { NOTIMPLEMENTED } from "../../../../../../base/common/notreached";
import { HTMLBRElement } from "../../../../../../engine/dom/html_br_element";
import { AttrNameOfComponentType, ComponentTypes } from "../../../../../viewModel/path";

export const text: Directive<Text | Element> = ({ el, get, effect }) => {
  effect(() => {
    const toSet = toDisplayString(get());
    if (!toSet) {
      const p = el.AsElement()!.AsHTMLElement()
      if (!p) NOTIMPLEMENTED()
      const { firstChild } = p
      if (firstChild && firstChild.nodeValue === HTMLBRElement.kTagName) {
        // noop
      } else {
        el.textContent = ''
        // 加个 br
        const br = el.GetDocument()!.createElement(HTMLBRElement.kTagName)
        br.setAttribute(AttrNameOfComponentType, ComponentTypes.TrailingBreak)
        p.appendChild(br);
      }
    } else {
      el.textContent = toSet;
    }
  });
};

export const toDisplayString = (value: any) =>
  value == null
    ? ''
    : isObject(value)
      ? JSON.stringify(value, null, 2)
      : String(value);
