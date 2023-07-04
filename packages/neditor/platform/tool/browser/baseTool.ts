import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { ITool, ToolInvocationPhase } from '../common/tool';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { Emitter } from '@neditor/core/base/common/event';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { IKeyboardInputEvent, IMouseInputEvent, InputEvents, IWheelInputEvent } from '../../input/browser/event';
import { Optional } from '@neditor/core/base/common/typescript';
import { NOTREACHED } from '../../../base/common/notreached';

export abstract class BaseTool extends Disposable implements ITool {
  protected isActivated = false;
  private _cursorBefore: Optional<CursorStyle>;

  abstract get id(): string
  private _phase = ToolInvocationPhase.noop;

  constructor(public canvas: ICanvas, public cursor: CursorStyle) {
    super();
  }

  get phase() {
    return this._phase;
  }

  set phase(val: ToolInvocationPhase) {
    if (val && val < this._phase) {
      throw new Error('Lifecycle cannot go backwards');
    }
    if (val && val - this._phase !== 1) {
      throw new Error('');
    }

    this._phase = val;
  }

  activate() {
    this.isActivated = true;
    this._cursorBefore = this.canvas.view.currentCursor();
    this.useCursor(this.cursor);
  }

  deactivate(): void {
    this.isActivated = false;
    if (!this._cursorBefore) NOTREACHED();
    this.useCursor(this._cursorBefore);
    this._cursorBefore = undefined;
  }
  useCursor(cursor: CursorStyle) {
    this.canvas.view.setCursor(cursor);
  }

  protected resetCursorStyle() {
    this.useCursor(this.cursor);
  }

  protected convertToPixelCoord(e: IMouseInputEvent) {
    return { x: Math.round(e.clientX), y: Math.round(e.clientY) };
  }

  processEvent(event: InputEvents) {
  }

  isStrokeTool(): this is StrokeTool {
    return false;
  }
}

export abstract class StrokeTool extends BaseTool {
  beginPrimaryAction(event: InputEvents): void {
  }

  continuePrimaryAction(event: InputEvents): void {
  }

  endPrimaryAction(event: InputEvents): void {
  }

  isStrokeTool() {
    return true;
  }
}
