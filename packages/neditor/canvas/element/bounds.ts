// Scene -> Scene coords, but in x1,x2,y1,y2 format.
//
// If the element is created from right to left, the width is going to be negative
// This set of functions retrieves the absolute position of the 4 points.

import { rotate } from '../../base/common/math';
import { CanvasElement } from './types';

// x and y position of top left corner, x and y position of bottom right corner
export type Bounds = readonly [x1: number, y1: number, x2: number, y2: number];

export const getElementAbsoluteCoords = (
  element: CanvasElement,
  includeBoundText: boolean = false,
): [number, number, number, number, number, number] => {
  // if (isFreeDrawElement(element)) {
  //   return getFreeDrawElementAbsoluteCoords(element);
  // }
  // if (isLinearElement(element)) {
  //   return LinearElementEditor.getElementAbsoluteCoords(
  //     element,
  //     includeBoundText,
  //   );
  // }
  const rect = element.getBoundingClientRect();
  // if (isTextElement(element)) {
  //   const container = getContainerElement(element);
  //   if (isArrowElement(container)) {
  //     const coords = LinearElementEditor.getBoundTextElementPosition(
  //       container,
  //       element as ExcalidrawTextElementWithContainer,
  //     );
  //     return [
  //       coords.x,
  //       coords.y,
  //       coords.x + element.width,
  //       coords.y + element.height,
  //       coords.x + element.width / 2,
  //       coords.y + element.height / 2,
  //     ];
  //   }
  // }
  return [
    rect.x,
    rect.y,
    rect.x + rect.width,
    rect.y + rect.height,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
  ];
};

export class ElementBounds {
  private static boundsCache = new WeakMap<CanvasElement,
    {
      bounds: Bounds;
      // version: ExcalidrawElement['version'];
    }>();

  static getBounds(element: CanvasElement) {
    const cachedBounds = ElementBounds.boundsCache.get(element);

    // if (cachedBounds?.version && cachedBounds.version === element.version) {
    //   return cachedBounds.bounds;
    // }

    const bounds = ElementBounds.calculateBounds(element);

    ElementBounds.boundsCache.set(element, {
      // version: element.version,
      bounds,
    });

    return bounds;
  }

  private static calculateBounds(element: CanvasElement): Bounds {
    // let bounds: [number, number, number, number];

    const [x1, y1, x2, y2, cx, cy] = getElementAbsoluteCoords(element);

    // if (isFreeDrawElement(element)) {
    //   const [minX, minY, maxX, maxY] = getBoundsFromPoints(
    //     element.points.map(([x, y]) =>
    //       rotate(x, y, cx - element.x, cy - element.y, element.angle),
    //     ),
    //   );
    //
    //   return [
    //     minX + element.x,
    //     minY + element.y,
    //     maxX + element.x,
    //     maxY + element.y,
    //   ];
    // }
    // if (isLinearElement(element)) {
    //   return getLinearElementRotatedBounds(element, cx, cy);
    // }
    // if (element.type === 'diamond') {
    //   const [x11, y11] = rotate(cx, y1, cx, cy, element.angle);
    //   const [x12, y12] = rotate(cx, y2, cx, cy, element.angle);
    //   const [x22, y22] = rotate(x1, cy, cx, cy, element.angle);
    //   const [x21, y21] = rotate(x2, cy, cx, cy, element.angle);
    //   const minX = Math.min(x11, x12, x22, x21);
    //   const minY = Math.min(y11, y12, y22, y21);
    //   const maxX = Math.max(x11, x12, x22, x21);
    //   const maxY = Math.max(y11, y12, y22, y21);
    //   bounds = [minX, minY, maxX, maxY];
    // }
    // if (element.type === 'ellipse') {
    //   const w = (x2 - x1) / 2;
    //   const h = (y2 - y1) / 2;
    //   const cos = Math.cos(element.angle);
    //   const sin = Math.sin(element.angle);
    //   const ww = Math.hypot(w * cos, h * sin);
    //   const hh = Math.hypot(h * cos, w * sin);
    //   bounds = [cx - ww, cy - hh, cx + ww, cy + hh];
    // }

    const angle = 0;
    const [x11, y11] = rotate(x1, y1, cx, cy, angle);
    const [x12, y12] = rotate(x1, y2, cx, cy, angle);
    const [x22, y22] = rotate(x2, y2, cx, cy, angle);
    const [x21, y21] = rotate(x2, y1, cx, cy, angle);
    const minX = Math.min(x11, x12, x22, x21);
    const minY = Math.min(y11, y12, y22, y21);
    const maxX = Math.max(x11, x12, x22, x21);
    const maxY = Math.max(y11, y12, y22, y21);
    return [minX, minY, maxX, maxY];
  }
}

export const getElementBounds = (element: CanvasElement): Bounds => {
  return ElementBounds.getBounds(element);
};

export const getCommonBounds = (
  elements: readonly CanvasElement[],
): Bounds => {
  if (!elements.length) {
    return [0, 0, 0, 0];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    const [x1, y1, x2, y2] = getElementBounds(element);
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return [minX, minY, maxX, maxY];
};
