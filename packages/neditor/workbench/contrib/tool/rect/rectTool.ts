import { ITool, IToolFactory, MouseButtonShortcut } from '@neditor/core/platform/tool/common/tool';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { BaseTool, StrokeTool } from '@neditor/core/platform/tool/browser/baseTool';
import { InputEvents } from '@neditor/core/platform/input/browser/event';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { Buttons } from "../../../../base/browser/mouseEvent";

export class RectTool extends StrokeTool {
  get id(): string {
    return RectToolID;
  }
  //
  // activate(shapes: Set<IShape>): void {
  // }
  // activatePrimaryAction(): void {
  // }
  beginPrimaryAction(event: InputEvents): void {
    const m = event.asMouseInputEvent();
    console.log('stat draw line', performance.now());
  }
  // beginPrimaryDoubleClickAction(event: InputEvents): void {
  // }
  continuePrimaryAction(event: InputEvents): void {
    console.log('continue draw line', performance.now());
  }
  // deactivate(): void {
  // }
  // deactivatePrimaryAction(): void {
  // }
  endPrimaryAction(event: InputEvents): void {
    console.log('end draw line', performance.now());
  }
  // handleKeyDown(e: IKeyboardInputEvent): void {
  // }
  // handleKeyUp(e: IKeyboardInputEvent): void {
  // }
  // handleMouseMove(e: IMouseInputEvent): void {
  // }

}

export const RectToolID = 'tool.rect';

export class RectToolFactory implements IToolFactory {
  id = RectToolID;

  createTool(canvas: ICanvas): ITool {
    return new RectTool(canvas, CursorStyle.arrow);
  }
  shortcut = new MouseButtonShortcut(Buttons.Primary)
}
