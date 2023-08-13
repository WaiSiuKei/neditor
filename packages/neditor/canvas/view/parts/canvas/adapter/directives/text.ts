import { isObject } from '@vue/shared';
import { Directive } from '.';
import { DCHECK } from '../../../../../../base/check';
import { HTMLSpanElement } from '../../../../../../engine/dom/html_span_element';
import { Text } from '../../../../../../engine/dom/text';
import { Element } from '../../../../../../engine/dom/element';

export const text: Directive<Text | Element> = ({ el, get, effect }) => {
  effect(() => {
    const toSet = toDisplayString(get());
    if (el.IsText()) {
      el.textContent = toSet;
    } else {
      DCHECK(el.tagName === HTMLSpanElement.kTagName);
      if (el.firstChild) {
        el.firstChild.textContent = toSet;
      } else {
        el.textContent = toSet;
      }
    }
  });
};

export const toDisplayString = (value: any) =>
  value == null
    ? ''
    : isObject(value)
      ? JSON.stringify(value, null, 2)
      : String(value);
