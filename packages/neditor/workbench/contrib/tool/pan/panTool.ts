import { ITool, IToolFactory, MouseButtonShortcut } from '@neditor/core/platform/tool/common/tool';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { BaseTool, StrokeTool } from '@neditor/core/platform/tool/browser/baseTool';
import { InputEventType, IMouseInputEvent, InputEvents, IWheelInputEvent } from '@neditor/core/platform/input/browser/event';
import { Optional } from '@neditor/core/base/common/typescript';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { Buttons } from "../../../../base/browser/mouseEvent";

class PanTool extends StrokeTool {
  startX: Optional<number>;
  startY: Optional<number>;
  fromTX: Optional<number>;
  fromTY: Optional<number>;

  get id(): string {
    return PanToolID;
  }
  activate() {
    super.activate();
    console.log('panTool::activate');
    this.useCursor(CursorStyle.grab)
  }

  activatePrimaryAction() {
    console.log('panTool::activatePrimaryAction');
    this.useCursor(CursorStyle.grabbing)
    this.startX = undefined;
    this.startY = undefined;
    this.fromTX = undefined;
    this.fromTY = undefined;
  }

  deactivatePrimaryAction() {
    // this.useCursor(CursorStyle.grab)
  }

  deactivate() {
    super.deactivate();
    console.log('panTool::deactivate');
  }

  beginPrimaryAction(event: InputEvents) {
    console.log('panTool::beginPrimaryAction');
    const e = event.asMouseInputEvent();
    if (e && e.type === InputEventType.MOUSE_DOWN) {
      this.canvas.view.setCursor(CursorStyle.grabbing);
      this.startX = e.pageX;
      this.startY = e.pageY;
      const mx = this.canvas.view.mx;
      this.fromTX = mx.tx;
      this.fromTY = mx.ty;
    }
  }

  continuePrimaryAction(event: InputEvents) {
    const e = event.asMouseInputEvent();
    if (e && e.type === InputEventType.MOUSE_MOVE) {
      const deltaX = Math.round(e.pageX - this.startX!);
      const deltaY = Math.round(e.pageY - this.startY!);
      this.canvas.view.translate(this.fromTX! + deltaX, this.fromTY! + deltaY);
    }
  }
  endPrimaryAction(event: InputEvents) {
    console.log('panTool::endPrimaryAction');
    this.canvas.view.setCursor(CursorStyle.grab);
  }
  processEvent(event: InputEvents) {
    // console.log(event.type);
  }
}

export const PanToolID = 'tool.pan';

export class PanToolFactory implements IToolFactory {
  id = PanToolID;

  createTool(canvas: ICanvas): ITool {
    return new PanTool(canvas, CursorStyle.grab);
  }
  shortcut = new MouseButtonShortcut(Buttons.Primary)
}
