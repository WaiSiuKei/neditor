import { CanvasElement } from '../element/types';

export const getElementAtPosition = (
  elements: readonly CanvasElement[],
  isAtPositionFn: (element: CanvasElement) => boolean,
) => {
  let hitElement = null;
  // We need to to hit testing from front (end of the array) to back (beginning of the array)
  // because array is ordered from lower z-index to highest and we want element z-index
  // with higher z-index
  for (let index = elements.length - 1; index >= 0; --index) {
    const element = elements[index];
    // if (element.isDeleted) {
    //   continue;
    // }
    if (isAtPositionFn(element)) {
      hitElement = element;
      break;
    }
  }

  return hitElement;
};

export const getElementsAtPosition = (
  elements: readonly CanvasElement[],
  isAtPositionFn: (element: CanvasElement) => boolean,
) => {
  // The parameter elements comes ordered from lower z-index to higher.
  // We want to preserve that order on the returned array.
  return elements.filter(
    (element) => isAtPositionFn(element),
  );
};
