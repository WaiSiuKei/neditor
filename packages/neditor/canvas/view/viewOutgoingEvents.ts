import {
  IKeyboardInputEvent,
  IMouseInputEvent,
  IWheelInputEvent
} from "@neditor/core/platform/input/browser/event";

export interface EventCallback<T> {
  (event: T): void;
}

export class ViewOutgoingEvents {
  public onKeyDown: EventCallback<IKeyboardInputEvent> | null = null;
  public onKeyUp: EventCallback<IKeyboardInputEvent> | null = null;
  public onContextMenu: EventCallback<IMouseInputEvent> | null = null;
  public onMouseMove: EventCallback<IMouseInputEvent> | null = null;
  public onMouseEnter: EventCallback<IMouseInputEvent> | null = null;
  public onMouseLeave: EventCallback<IMouseInputEvent> | null = null;
  public onMouseDown: EventCallback<IMouseInputEvent> | null = null;
  public onMouseUp: EventCallback<IMouseInputEvent> | null = null;
  public onMouseDrag: EventCallback<IMouseInputEvent> | null = null;
  public onMouseDragStart: EventCallback<IMouseInputEvent> | null = null;
  public onMouseDrop: EventCallback<IMouseInputEvent> | null = null;
  public onMouseDropCanceled: EventCallback<IMouseInputEvent> | null = null;
  public onMouseWheel: EventCallback<IWheelInputEvent> | null = null;
  public onDoubleClick: EventCallback<IMouseInputEvent> | null = null;

  constructor() {
  }

  public emitKeyDown(e: IKeyboardInputEvent): void {
    if (this.onKeyDown) {
      this.onKeyDown(e);
    }
  }

  public emitKeyUp(e: IKeyboardInputEvent): void {
    if (this.onKeyUp) {
      this.onKeyUp(e);
    }
  }

  public emitContextMenu(e: IMouseInputEvent): void {
    if (this.onContextMenu) {
      this.onContextMenu(e);
    }
  }

  public emitMouseMove(e: IMouseInputEvent): void {
    if (this.onMouseMove) {
      this.onMouseMove(e);
    }
  }

  public emitMouseLeave(e: IMouseInputEvent): void {
    if (this.onMouseLeave) {
      this.onMouseLeave(e);
    }
  }

  public emitMouseEnter(e: IMouseInputEvent): void {
    if (this.onMouseEnter) {
      this.onMouseEnter(e);
    }
  }

  public emitMouseDown(e: IMouseInputEvent): void {
    if (this.onMouseDown) {
      this.onMouseDown(e);
    }
  }

  public emitMouseUp(e: IMouseInputEvent): void {
    if (this.onMouseUp) {
      this.onMouseUp(e);
    }
  }

  public emitMouseDrag(e: IMouseInputEvent): void {
    if (this.onMouseDrag) {
      this.onMouseDrag(e);
    }
  }

  public emitMouseDragStart(e: IMouseInputEvent): void {
    if (this.onMouseDragStart) {
      this.onMouseDragStart(e);
    }
  }

  public emitMouseDrop(e: IMouseInputEvent): void {
    if (this.onMouseDrop) {
      this.onMouseDrop(e);
    }
  }

  public emitMouseDropCanceled(e: IMouseInputEvent): void {
    if (this.onMouseDropCanceled) {
      this.onMouseDropCanceled(e);
    }
  }

  public emitDoubleClick(e: IMouseInputEvent): void {
    if (this.onDoubleClick) {
      this.onDoubleClick(e);
    }
  }

  public emitMouseWheel(e: IWheelInputEvent): void {
    if (this.onMouseWheel) {
      this.onMouseWheel(e);
    }
  }
}
