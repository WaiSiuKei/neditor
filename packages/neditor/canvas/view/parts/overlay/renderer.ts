import { ICanvasState } from '../../../canvas/canvas';
import { getCommonBounds } from '../../../element/bounds';
import { CanvasElement } from '../../../element/types';
import { RenderConfig } from '../../type';

export const DEFAULT_SPACING = 2;

const getSelectionFromElements = (elements: readonly CanvasElement[]) => {
  const [elementX1, elementY1, elementX2, elementY2] =
    getCommonBounds(elements);
  return {
    angle: 0,
    elementX1,
    elementX2,
    elementY1,
    elementY2,
    selectionColors: ['rgb(0,118,255)'],
    dashed: false,
    cx: elementX1 + (elementX2 - elementX1) / 2,
    cy: elementY1 + (elementY2 - elementY1) / 2,
  };
};

const renderSelectionBorder = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  elementProperties: {
    angle: number;
    elementX1: number;
    elementY1: number;
    elementX2: number;
    elementY2: number;
    selectionColors: string[];
    dashed?: boolean;
    cx: number;
    cy: number;
  },
  padding = DEFAULT_SPACING * 2,
) => {
  const {
    angle,
    elementX1,
    elementY1,
    elementX2,
    elementY2,
    selectionColors,
    cx,
    cy,
    dashed,
  } = elementProperties;
  const elementWidth = elementX2 - elementX1;
  const elementHeight = elementY2 - elementY1;

  const linePadding = padding / renderConfig.zoom;
  const lineWidth = 8 / renderConfig.zoom;
  const spaceWidth = 4 / renderConfig.zoom;

  context.save();
  // context.translate(renderConfig.scrollX, renderConfig.scrollY);
  context.lineWidth = 1 / renderConfig.zoom;

  const count = selectionColors.length;
  for (let index = 0; index < count; ++index) {
    context.strokeStyle = selectionColors[index];
    if (dashed) {
      context.setLineDash([
        lineWidth,
        spaceWidth + (lineWidth + spaceWidth) * (count - 1),
      ]);
    }
    context.lineDashOffset = (lineWidth + spaceWidth) * index;
    strokeRectWithRotation(
      context,
      elementX1 - linePadding,
      elementY1 - linePadding,
      elementWidth + linePadding * 2,
      elementHeight + linePadding * 2,
      cx,
      cy,
      angle,
    );
  }
  context.restore();
};

export const renderElementsBoxHighlight = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  elements: readonly CanvasElement[],
) => {
  const selection = getSelectionFromElements(elements);
  renderSelectionBorder(context, renderConfig, selection);
};

const strokeRectWithRotation = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number,
  fill: boolean = false,
  /** should account for zoom */
  radius: number = 0,
) => {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  if (fill) {
    context.fillRect(x - cx, y - cy, width, height);
  }
  if (radius && context.roundRect) {
    context.beginPath();
    context.roundRect(x - cx, y - cy, width, height, radius);
    context.stroke();
    context.closePath();
  } else {
    context.strokeRect(x - cx, y - cy, width, height);
  }
  context.restore();
};
