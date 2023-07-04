import { ViewOutgoingEvents } from './viewOutgoingEvents';
import {
  IKeyboardInputEvent,
  IMouseInputEvent,
  IWheelInputEvent
} from '@neditor/core/platform/input/browser/event';

export class ViewController {
  private readonly userInputEvents: ViewOutgoingEvents;

  constructor(
    userInputEvents: ViewOutgoingEvents,
  ) {
    this.userInputEvents = userInputEvents;
  }
  public emitKeyDown(e: IKeyboardInputEvent): void {
    this.userInputEvents.emitKeyDown(e);
  }

  public emitKeyUp(e: IKeyboardInputEvent): void {
    this.userInputEvents.emitKeyUp(e);
  }

  public emitContextMenu(e: IMouseInputEvent): void {
    this.userInputEvents.emitContextMenu(e);
  }

  public emitMouseMove(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseMove(e);
  }

  public emitMouseLeave(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseLeave(e);
  }

  public emitMouseEnter(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseEnter(e);
  }

  public emitMouseUp(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseUp(e);
  }

  public emitMouseDown(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseDown(e);
  }

  public emitMouseDrag(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseDrag(e);
  }

  public emitMouseDragStart(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseDragStart(e);
  }

  public emitMouseDrop(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseDrop(e);
  }

  public emitMouseDropCanceled(e: IMouseInputEvent): void {
    this.userInputEvents.emitMouseDropCanceled(e);
  }

  public emitDbClick(e: IMouseInputEvent): void {
    this.userInputEvents.emitDoubleClick(e);
  }

  public emitMouseWheel(e: IWheelInputEvent): void {
    this.userInputEvents.emitMouseWheel(e);
  }
}
