import { ITool, IToolFactory, MouseButtonShortcut, } from '@neditor/core/platform/tool/common/tool';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { IMouseInputEvent, InputEvents } from '../../../../platform/input/browser/event';
import { FreehandElement } from '../../../../engine/dom/custom/freehand_element';
import { BaseTool, StrokeTool } from '../../../../platform/tool/browser/baseTool';
import { Optional } from '../../../../base/common/typescript';
import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke } from './utils';
import { DCHECK } from '../../../../base/check';
import { Buttons } from '../../../../base/browser/mouseEvent';

const options = {
  size: 5,
  thinning: 0.5,
  smoothing: 1,
  streamline: 0.5,
  easing: (t: number) => t,
  start: {
    taper: 0,
    easing: (t: number) => t,
    cap: true
  },
  end: {
    taper: 100,
    easing: (t: number) => t,
    cap: true
  }
};

export class FreehandTool extends StrokeTool {
  get id(): string {
    return BrushToolID;
  }

  handleMouseMove(e: IMouseInputEvent) {
  }
  _history: Array<[number, number, number]> = [];
  _node: Optional<FreehandElement>;
  beginPrimaryAction(e: InputEvents) {
    this._history.length = 0;
    let doc = this.canvas.view.document;
    let node = doc.createElement<FreehandElement>(FreehandElement.kTagName);
    Object.assign(node.style, {
      position: 'absolute',
      top: '0px',
      left: '0px',
      display: 'block',
      width: '1px',
      height: '1px'
    });
    node.setAttribute('fill', '#000');
    doc.body!.appendChild(node);
    this._node = node;
    const pos = this.convertToPixelCoord(e.asMouseInputEvent()!);
    this._history.push([pos.x, pos.y, 1]);
  }
  continuePrimaryAction(e: InputEvents) {
    const pos = this.convertToPixelCoord(e.asMouseInputEvent()!);
    this._history.push([pos.x, pos.y, 1]);
    const stroke = getStroke(this._history, options);
    const pathData = getSvgPathFromStroke(stroke);
    DCHECK(this._node);
    this._node.setAttribute('d', pathData);
  }
  endPrimaryAction(e: InputEvents) {
    const pos = this.convertToPixelCoord(e.asMouseInputEvent()!);
    this._history.push([pos.x, pos.y, 1]);
  }
}

export const BrushToolID = 'tool.brush';

export class BrushToolFactory implements IToolFactory {
  id = BrushToolID;

  createTool(canvas: ICanvas): ITool {
    return new FreehandTool(canvas, CursorStyle.arrow);
  }
  shortcut = new MouseButtonShortcut(Buttons.Primary);
}
