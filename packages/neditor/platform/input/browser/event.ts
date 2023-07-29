import { KeyCode } from '@neditor/core/base/common/keyCodes';
import { Optional } from '@neditor/core/base/common/typescript';
import { Node as VirtualNode } from '@neditor/core/engine/dom/node';
import { MouseTargetType, } from '@neditor/core/canvas/canvas/browser';
import { CanvasMouseEvent } from '@neditor/core/canvas/view/controller/mouseEventFactory';
import { IKeyboardEvent } from '../../../base/browser/keyboardEvent';

export const InputEventType = {
  // Common
  // PASTE: 'paste',
  // Mouse
  // CLICK: 'click',
  // AUXCLICK: 'auxclick',
  DBLCLICK: 'dblclick',
  MOUSE_UP: 'mouseup',
  MOUSE_DOWN: 'mousedown',
  // MOUSE_OVER: 'mouseover',
  MOUSE_MOVE: 'mousemove',
  // MOUSE_OUT: 'mouseout',
  MOUSE_ENTER: 'mouseenter',
  MOUSE_LEAVE: 'mouseleave',
  // POINTER_UP: 'pointerup',
  // POINTER_DOWN: 'pointerdown',
  // POINTER_MOVE: 'pointermove',
  TOUCH_START: 'touchstart',
  TOUCH_END: 'touchend',
  TOUCH_CANCEL: 'touchcancel',
  TOUCH_MOVE: 'touchmove',
  CONTEXT_MENU: 'contextmenu',
  WHEEL: 'wheel',
  // Keyboard
  KEY_DOWN: 'keydown',
  // KEY_PRESS: 'keypress',
  KEY_UP: 'keyup',
  // HTML Document
  // LOAD: 'load',
  // BEFORE_UNLOAD: 'beforeunload',
  // UNLOAD: 'unload',
  // PAGE_SHOW: 'pageshow',
  // PAGE_HIDE: 'pagehide',
  // ABORT: 'abort',
  // ERROR: 'error',
  // RESIZE: 'resize',
  // SCROLL: 'scroll',
  // FULLSCREEN_CHANGE: 'fullscreenchange',
  // WK_FULLSCREEN_CHANGE: 'webkitfullscreenchange',
  // Form
  // SELECT: 'select',
  // CHANGE: 'change',
  // SUBMIT: 'submit',
  // RESET: 'reset',
  // FOCUS: 'focus',
  // FOCUS_IN: 'focusin',
  // FOCUS_OUT: 'focusout',
  // BLUR: 'blur',
  // INPUT: 'input',
  // Local Storage
  // STORAGE: 'storage',
  // Drag
  DRAG_START: 'dragstart',
  DRAG: 'drag',
  // DRAG_ENTER: 'dragenter',
  // DRAG_LEAVE: 'dragleave',
  // DRAG_OVER: 'dragover',
  DROP: 'drop',
  DRAG_END: 'dragend',
  // Page Visibility
  // VISIBILITY_CHANGE: 'visibilitychange',
  ShortcutOverride: 'shortcutOverride'
} as const;
export type TInputEventType = typeof InputEventType[keyof typeof InputEventType]

export interface IEvent {
  type: TInputEventType;
  accept(): void;
  ignore(): void;
  isAccepted(): boolean;
  asMouseInputEvent(): Optional<IMouseInputEvent>;
  isMouseInputEvent(): this is IMouseInputEvent;
  asKeyboardInputEvent(): Optional<IKeyboardInputEvent>;
  isKeyboardInputEvent(): this is IKeyboardInputEvent;
  asWheelInputEvent(): Optional<IWheelInputEvent>;
  isWheelInputEvent(): this is IWheelInputEvent;
}

export class BaseEvent implements IEvent {
  private accepted = false;
  constructor(public readonly type: TInputEventType) {
  }
  accept(): void {
    this.accepted = true;
  }
  ignore(): void {
    this.accepted = false;
  }
  isAccepted(): boolean {
    return this.accepted;
  }
  asMouseInputEvent(): Optional<IMouseInputEvent> {
    return undefined;
  }
  isMouseInputEvent(): this is IMouseInputEvent {
    return false;
  }
  asKeyboardInputEvent(): Optional<IKeyboardInputEvent> {
    return undefined;
  }
  isKeyboardInputEvent(): this is IKeyboardInputEvent {
    return false;
  }
  asWheelInputEvent(): Optional<IWheelInputEvent> {
    return undefined;
  }
  isWheelInputEvent(): this is IWheelInputEvent {
    return false;
  }
}

export interface IMouseInputEventInit {
  // readonly leftButton: boolean;
  // readonly middleButton: boolean;
  // readonly rightButton: boolean;
  readonly buttons: number;
  // readonly target: string;
  readonly targetPath: PathInfo[];
  // readonly detail: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  // readonly ctrlKey: boolean;
  // readonly shiftKey: boolean;
  // readonly altKey: boolean;
  // readonly metaKey: boolean;
  // readonly timestamp: number;
}

export interface IMouseInputEvent extends IEvent, IMouseInputEventInit {
}

export class MouseInputEvent extends BaseEvent implements IMouseInputEvent {
  readonly targetPath: PathInfo[];
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly buttons: number;
  constructor(type: typeof InputEventType.MOUSE_DOWN
                | typeof InputEventType.MOUSE_UP
                | typeof InputEventType.MOUSE_MOVE
                | typeof InputEventType.MOUSE_ENTER
                | typeof InputEventType.MOUSE_LEAVE
                | typeof InputEventType.DBLCLICK
                | typeof InputEventType.CONTEXT_MENU
                | typeof InputEventType.DRAG_START
                | typeof InputEventType.DRAG
                | typeof InputEventType.DROP
                | typeof InputEventType.DRAG_END,
              init: IMouseInputEventInit) {
    super(type);

    this.targetPath = init.targetPath;
    this.clientX = init.clientX;
    this.clientY = init.clientY;
    this.pageX = init.pageX;
    this.pageY = init.pageY;
    this.buttons = init.buttons;
  }
  asMouseInputEvent(): Optional<IMouseInputEvent> {
    return this;
  }
  isMouseInputEvent(): this is IMouseInputEvent {
    return true;
  }
}

export interface IWheelInputEventInit {

  // readonly wheelDelta: number;
  // readonly wheelDeltaX: number;
  // readonly wheelDeltaY: number;
  readonly deltaX: number;
  readonly deltaY: number;
  // readonly deltaZ: number;
  // readonly deltaMode: number;
}

export interface IWheelInputEvent extends IEvent, IWheelInputEventInit {
}

export class WheelInputEvent extends BaseEvent implements IWheelInputEvent {
  readonly deltaX: number;
  readonly deltaY: number;
  constructor(init: IWheelInputEventInit) {
    super(InputEventType.WHEEL);
    this.deltaX = init.deltaX;
    this.deltaY = init.deltaY;
  }
  asWheelInputEvent() {
    return this;
  }
  isWheelInputEvent(): this is IWheelInputEvent {
    return true;
  }
}

export interface IKeyboardInputEventInit {
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly keyCode: KeyCode;
  readonly code: string;
  readonly init: IKeyboardEvent;
}

export interface IKeyboardInputEvent extends IEvent, IKeyboardInputEventInit {
}

export class KeyboardInputEvent extends BaseEvent implements IKeyboardInputEvent {
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly keyCode: KeyCode;
  readonly code: string;
  readonly init: IKeyboardEvent;
  constructor(
    type: typeof InputEventType.KEY_UP
      | typeof InputEventType.KEY_DOWN,
    init: IKeyboardEvent) {
    super(type);
    this.ctrlKey = init.ctrlKey;
    this.shiftKey = init.shiftKey;
    this.altKey = init.altKey;
    this.metaKey = init.metaKey;
    this.keyCode = init.keyCode;
    this.code = init.code;
    this.init = init;
  }
  asKeyboardInputEvent() {
    return this;
  }
  isKeyboardInputEvent(): this is IKeyboardInputEvent {
    return true;
  }
}

export type InputEvents = IMouseInputEvent | IWheelInputEvent | IKeyboardInputEvent

export interface IMouseTarget {
  readonly type: MouseTargetType;
  readonly targetPath: PathInfo[];
}

export class PathInfo {
  static fromVirtualDOMNode(node: VirtualNode) {
    return new PathInfo(node);
  }
  protected constructor(
    public node: VirtualNode,
  ) {
  }
}

export function createMouseEvent(type: typeof InputEventType.MOUSE_DOWN
                                   | typeof InputEventType.MOUSE_UP
                                   | typeof InputEventType.MOUSE_MOVE
                                   | typeof InputEventType.MOUSE_ENTER
                                   | typeof InputEventType.MOUSE_LEAVE
                                   | typeof InputEventType.DBLCLICK
                                   | typeof InputEventType.CONTEXT_MENU
                                   | typeof InputEventType.DRAG_START
                                   | typeof InputEventType.DRAG
                                   | typeof InputEventType.DROP
                                   | typeof InputEventType.DRAG_END,
                                 e: CanvasMouseEvent,
                                 t: IMouseTarget,
                                 buttons = 0,
) {
  return new MouseInputEvent(type, {
    buttons: buttons || e.buttons,
    clientX: e.relativePos.x,
    clientY: e.relativePos.y,
    pageX: e.pos.x,
    pageY: e.pos.y,
    targetPath: t.targetPath || []
  });
}

export interface IEventFilter {
  eventFilter(e: InputEvents): boolean;
}
