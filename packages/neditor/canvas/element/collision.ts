import { NOTIMPLEMENTED } from '../../base/common/notreached';
import { RecordType } from '../../common/node';
import { ICanvasState } from '../canvas/canvas';
import * as GA from '../ga';
import * as GADirection from '../gadirections';
import * as GALine from '../galines';
import * as GAPoint from '../gapoints';
import * as GATransform from '../gatransforms';
import { getTypeAttr } from '../viewModel/path';
import { getElementAbsoluteCoords } from './bounds';
import { isBlockElement, isImageElement, isTextElement } from './typeCheck';
import { CanvasElement, Point } from './types';

export const hitTest = (
  element: CanvasElement,
  appState: ICanvasState,
  // frameNameBoundsCache: FrameNameBoundsCache,
  x: number,
  y: number,
): boolean => {
  // How many pixels off the shape boundary we still consider a hit
  const threshold = 10 / appState.zoom;
  const point: Point = [x, y];

  // if (
  //   isElementSelected(appState, element) &&
  //   shouldShowBoundingBox([element], appState)
  // ) {
  //   return isPointHittingElementBoundingBox(
  //     element,
  //     point,
  //     threshold,
  //     frameNameBoundsCache,
  //   );
  // }
  //
  // const boundTextElement = getBoundTextElement(element);
  // if (boundTextElement) {
  //   const isHittingBoundTextElement = hitTest(
  //     boundTextElement,
  //     appState,
  //     frameNameBoundsCache,
  //     x,
  //     y,
  //   );
  //   if (isHittingBoundTextElement) {
  //     return true;
  //   }
  // }
  return isHittingElementNotConsideringBoundingBox(
    element,
    appState,
    // frameNameBoundsCache,
    point,
  );
};

export const isHittingElementNotConsideringBoundingBox = (
  element: CanvasElement,
  appState: ICanvasState,
  // frameNameBoundsCache: FrameNameBoundsCache | null,
  point: Point,
): boolean => {
  const threshold = 10 / appState.zoom;
  const check = isTextElement(element)
    ? isStrictlyInside
    : isElementDraggableFromInside(element)
      ? isInsideCheck
      : isNearCheck;
  return hitTestPointAgainstElement({
    element,
    point,
    threshold,
    check,
    // frameNameBoundsCache,
  });
};

type HitTestArgs = {
  element: CanvasElement;
  point: Point;
  threshold: number;
  check: (distance: number, threshold: number) => boolean;
  // frameNameBoundsCache: FrameNameBoundsCache | null;
};

const hitTestPointAgainstElement = (args: HitTestArgs): boolean => {
  const type = getTypeAttr(args.element);
  switch (type) {
    case NodeType.Text:
    case NodeType.Block:
    case NodeType.Image: {
      const distance = distanceToBindableElement(args.element, args.point);
      return args.check(distance, args.threshold);
    }
    default:
      NOTIMPLEMENTED();
  }
  // switch (args.element.type) {
  //   case 'rectangle':
  //   case 'image':
  //   case 'text':
  //   case 'diamond':
  //   case 'ellipse':
  //     const distance = distanceToBindableElement(args.element, args.point);
  //     return args.check(distance, args.threshold);
  //   case 'freedraw': {
  //     if (
  //       !args.check(
  //         distanceToRectangle(args.element, args.point),
  //         args.threshold,
  //       )
  //     ) {
  //       return false;
  //     }
  //
  //     return hitTestFreeDrawElement(args.element, args.point, args.threshold);
  //   }
  //   case 'arrow':
  //   case 'line':
  //     return hitTestLinear(args);
  //   case 'selection':
  //     console.warn(
  //       'This should not happen, we need to investigate why it does.',
  //     );
  //     return false;
  //   case 'frame': {
  //     // check distance to frame element first
  //     if (
  //       args.check(
  //         distanceToBindableElement(args.element, args.point),
  //         args.threshold,
  //       )
  //     ) {
  //       return true;
  //     }
  //
  //     const frameNameBounds = args.frameNameBoundsCache?.get(args.element);
  //
  //     if (frameNameBounds) {
  //       return args.check(
  //         distanceToRectangleBox(frameNameBounds, args.point),
  //         args.threshold,
  //       );
  //     }
  //     return false;
  //   }
  //   default:
  //     NOTIMPLEMENTED();
  // }
};

const distanceToRectangle = (
  element: CanvasElement
  // | ExcalidrawRectangleElement
  // | ITextNodeViewModel
  // | ExcalidrawFreeDrawElement
  // | IImageNodeViewModel
  // | ExcalidrawFrameElement
  ,
  point: Point,
): number => {
  const [, pointRel, hwidth, hheight] = pointRelativeToElement(element, point);
  return Math.max(
    GAPoint.distanceToLine(pointRel, GALine.equation(0, 1, -hheight)),
    GAPoint.distanceToLine(pointRel, GALine.equation(1, 0, -hwidth)),
  );
};

// Returns:
//   1. the point relative to the elements (x, y) position
//   2. the point relative to the element's center with positive (x, y)
//   3. half element width
//   4. half element height
//
// Note that for linear elements the (x, y) position is not at the
// top right corner of their boundary.
//
// Rectangles, diamonds and ellipses are symmetrical over axes,
// and other elements have a rectangular boundary,
// so we only need to perform hit tests for the positive quadrant.
const pointRelativeToElement = (
  element: CanvasElement,
  pointTuple: Point,
): [GA.Point, GA.Point, number, number] => {
  const point = GAPoint.from(pointTuple);
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element);
  const center = coordsCenter(x1, y1, x2, y2);
  // GA has angle orientation opposite to `rotate`
  // const rotate = GATransform.rotation(center, element.angle);
  // TODO: rotation
  const rotate = GATransform.rotation(center, 0);
  const pointRotated = GATransform.apply(rotate, point);
  const pointRelToCenter = GA.sub(pointRotated, GADirection.from(center));
  const pointRelToCenterAbs = GAPoint.abs(pointRelToCenter);
  const rect = element.getBoundingClientRect();
  const elementPos = GA.offset(rect.x, rect.y);
  const pointRelToPos = GA.sub(pointRotated, elementPos);
  const halfWidth = (x2 - x1) / 2;
  const halfHeight = (y2 - y1) / 2;
  return [pointRelToPos, pointRelToCenterAbs, halfWidth, halfHeight];
};

const coordsCenter = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): GA.Point => {
  return GA.point((x1 + x2) / 2, (y1 + y2) / 2);
};

export const distanceToBindableElement = (
  element: CanvasElement,
  point: Point,
): number => {
  switch (getTypeAttr(element)) {
    //   case "rectangle":
    case NodeType.Image:
    case NodeType.Text:
    case NodeType.Block:
      //   case "frame":
      return distanceToRectangle(element, point);
    //   case "diamond":
    //     return distanceToDiamond(element, point);
    //   case "ellipse":
    //     return distanceToEllipse(element, point);
    default:
      NOTIMPLEMENTED();
  }
};

const isElementDraggableFromInside = (
  element: CanvasElement,
): boolean => {
  // if (element.type === "arrow") {
  //   return false;
  // }
  //
  // if (element.type === "freedraw") {
  //   return true;
  // }
  const isDraggableFromInside = isBlockElement(element);
  // !isTransparent(element.backgroundColor) || hasBoundTextElement(element);
  // if (element.type === "line") {
  //   return isDraggableFromInside && isPathALoop(element.points);
  // }
  return isDraggableFromInside || isImageElement(element);
};

const isStrictlyInside = (distance: number, threshold: number): boolean => {
  return distance < 0;
};
const isInsideCheck = (distance: number, threshold: number): boolean => {
  return distance < threshold;
};
const isNearCheck = (distance: number, threshold: number): boolean => {
  return Math.abs(distance) < threshold;
};
const isOutsideCheck = (distance: number, threshold: number): boolean => {
  return 0 <= distance && distance < threshold;
};
