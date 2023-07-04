import { Element } from '../../../../../engine/dom/element';

export const checkAttr = (el: Element, name: string): string | null => {
  const val = el.getAttribute(name);
  if (val != null) el.removeAttribute(name);
  return val;
};
