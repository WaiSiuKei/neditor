import { addDisposableListener, addStandardDisposableListener, EventType as DOMEventType } from '@neditor/core/base/browser/dom';
import { IKeyboardEvent } from '@neditor/core/base/browser/keyboardEvent';
import { tail } from '@neditor/core/base/common/array';
import { IMatrix } from '@neditor/core/base/common/geometry';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { isNumber } from '@neditor/core/base/common/type';
import { Optional } from '@neditor/core/base/common/typescript';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { HitTestOptions, DOMHitTestResult } from '@neditor/core/engine/layout/layout_manager';
import { createMouseEvent, InputEventType, IKeyboardInputEvent, IMouseTarget, KeyboardInputEvent, WheelInputEvent, TInputEventType, } from '@neditor/core/platform/input/browser/event';
import { IMouseWheelEvent } from '../../../base/browser/mouseEvent';
import { HitTestLevel } from '../../../platform/input/common/input';
import { MouseTargetType } from '../../canvas/browser';
import { GlobalEditorPointerMoveMonitor } from '../../canvas/dom';
import { ViewController } from '../viewController';
import { CanvasMouseEvent, EditorMouseEventFactory } from './mouseEventFactory';
import { MouseTargetFactory } from './mouseTarget';

/**
 * Merges mouse events when mouse move events are throttled
 */
export function createMouseMoveEventMerger() {
  return function (lastEvent: CanvasMouseEvent | null, currentEvent: CanvasMouseEvent): CanvasMouseEvent {
    let targetIsWidget = false;
    // if (mouseTargetFactory) {
    //   targetIsWidget = mouseTargetFactory.mouseTargetIsWidget(currentEvent);
    // }
    if (!targetIsWidget) {
      currentEvent.preventDefault();
    }
    return currentEvent;
  };
}

export interface IPointerHandlerHelper {
  viewDomNode: HTMLElement;
  hitTest(posx: number, posy: number, opt?: HitTestOptions): DOMHitTestResult[];
  getTransform(): IMatrix;
  getHitTestLevel(eventType: TInputEventType): HitTestLevel;
}

export class MouseHandler extends Disposable {

  static readonly MOUSE_MOVE_MINIMUM_TIME = 100; // ms
  static readonly DoubleClickInterval = 400; // ms

  // protected _context: ViewContext;
  protected viewController: ViewController;
  protected viewHelper: IPointerHandlerHelper;
  protected mouseTargetFactory: MouseTargetFactory;
  protected readonly _mouseDownOperation: MouseDownOperation;
  private lastMouseLeaveTime: number;
  private mousePressed = false;
  private multiClickCount = 0;
  private lastClickTimeStamp = 0; // timestamp
  private lastClickPosX: Optional<number>;
  private lastClickPosY: Optional<number>;

  constructor(viewController: ViewController, viewHelper: IPointerHandlerHelper) {
    super();

    // this._context = context;
    this.viewController = viewController;
    this.viewHelper = viewHelper;
    this.mouseTargetFactory = new MouseTargetFactory(viewHelper);

    this._mouseDownOperation = this._register(new MouseDownOperation(
      this.viewController,
      this.viewHelper,
      (e, testEventTarget) => this._createMouseTarget(e, { hitTestLevel: viewHelper.getHitTestLevel(InputEventType.DRAG) }),
      () => this.mousePressed = false,
    ));

    this.lastMouseLeaveTime = -1;

    const mouseEvents = new EditorMouseEventFactory(this.viewHelper);

    // this._register(mouseEvents.onContextMenu(boundaryDomNode, e => this._onContextMenu(e, true)));
    this._register(mouseEvents.onMouseMove(this.viewHelper.viewDomNode, (e) => this._onMouseMove(e)));
    this._register(mouseEvents.onMouseUp(this.viewHelper.viewDomNode, (e) => this._onMouseUp(e)));

    // `pointerdown` events can't be used to determine if there's a double click, or triple click
    // because their `e.detail` is always 0.
    // We will therefore save the pointer id for the mouse and then reuse it in the `mousedown` event
    // for `element.setPointerCapture`.
    let mousePointerId: number = 0;
    // this._register(mouseEvents.onPointerDown(this.viewHelper.viewDomNode, (e, pointerType, pointerId) => {
    //   if (pointerType === 'mouse') {
    //     mousePointerId = pointerId;
    //   }
    // }));
    // The `pointerup` listener registered by `GlobalEditorPointerMoveMonitor` does not get invoked 100% of the times.
    // I speculate that this is because the `pointerup` listener is only registered during the `mousedown` event, and perhaps
    // the `pointerup` event is already queued for dispatching, which makes it that the new listener doesn't get fired.
    // See https://github.com/microsoft/vscode/issues/146486 for repro steps.
    // To compensate for that, we simply register here a `pointerup` listener and just communicate it.
    this._register(addDisposableListener(this.viewHelper.viewDomNode, DOMEventType.POINTER_UP, (e: PointerEvent) => {
      this._mouseDownOperation.onPointerUp();
    }));
    this._register(mouseEvents.onMouseDown(this.viewHelper.viewDomNode, (e) => this._onMouseDown(e, mousePointerId)));
    this._register(addStandardDisposableListener(this.viewHelper.viewDomNode, DOMEventType.KEY_DOWN, this._onKeyDown.bind(this)));
    this._register(addStandardDisposableListener(this.viewHelper.viewDomNode, DOMEventType.KEY_UP, this._onKeyUp.bind(this)));
    this._register(addDisposableListener(this.viewHelper.viewDomNode, DOMEventType.WHEEL, this._onMouseWheel.bind(this), { capture: true, passive: false }));
  }

  protected _createMouseTarget(e: CanvasMouseEvent, opt: HitTestOptions): IMouseTarget {
    return this.mouseTargetFactory.createMouseTarget(e.pos, e.target, opt);
  }

  protected _onContextMenu(e: CanvasMouseEvent, testEventTarget: boolean): void {
    NOTIMPLEMENTED();
    // this.viewController.emitContextMenu({
    //   event: e,
    //   target: this._createMouseTarget(e, testEventTarget),
    // });
  }

  private lastMouseMoveTarget: Optional<IMouseTarget>;
  private lastEmittedMouseEnter: Optional<IMouseTarget>;
  private enterLeaveCounter = 0;
  public _onMouseMove(e: CanvasMouseEvent): void {
    if (this._mouseDownOperation.isActive()) {
      // this.viewController.emitMouseMove(createMouseEvent(EventType.MOUSE_MOVE, e, t));
      // this.lastMouseMoveTarget = t;
      return;
    }

    const t = this._createMouseTarget(e, { hitTestLevel: this.viewHelper.getHitTestLevel(InputEventType.MOUSE_MOVE) });

    if (t.type !== MouseTargetType.Unknown) {
      if (this.lastEmittedMouseEnter) {
        const nextPath = t.targetPath;
        const prevPath = this.lastEmittedMouseEnter.targetPath;

        const next = tail(nextPath).node;
        const last = tail(prevPath).node;
        if (next && next !== last) {
          this.viewController.emitMouseLeave(createMouseEvent(InputEventType.MOUSE_LEAVE, e, this.lastEmittedMouseEnter));
          this.enterLeaveCounter--;
          this.viewController.emitMouseEnter(createMouseEvent(InputEventType.MOUSE_ENTER, e, t));
          this.enterLeaveCounter++;
          this.lastEmittedMouseEnter = t;
        }
      } else {
        this.viewController.emitMouseEnter(createMouseEvent(InputEventType.MOUSE_ENTER, e, t));
        this.enterLeaveCounter++;
        this.lastEmittedMouseEnter = t;
      }

      if (this.enterLeaveCounter > 1) NOTREACHED();

      // const actualMouseMoveTime = e.timestamp;
      // if (actualMouseMoveTime < this.lastMouseLeaveTime) {
      //   // Due to throttling, this event occurred before the mouse left the editor, therefore ignore it.
      //   return;
      // }
      this.viewController.emitMouseMove(createMouseEvent(InputEventType.MOUSE_MOVE, e, t));
      this.lastMouseMoveTarget = t;
    } else {
      this._handleMouseLeave(e);
    }
  }

  _handleMouseLeave(e: CanvasMouseEvent) {
    if (this.lastEmittedMouseEnter) {
      this.viewController.emitMouseLeave(createMouseEvent(InputEventType.MOUSE_LEAVE, e, this.lastEmittedMouseEnter));
      this.enterLeaveCounter--;
      this.lastMouseMoveTarget = undefined;
      this.lastEmittedMouseEnter = undefined;
    }
  }

  // _onWindowBlur(e: FocusEvent): void {
  //   this._handleMouseLeave(null);
  // }

  // public _onPageVisibilityChange(e: Event): void {
  //   if (document.hidden) {
  //     if (this.lastEmittedMouseEnter) {
  //       this.viewController.emitMouseLeave({
  //         event: null,
  //         target: this.lastEmittedMouseEnter,
  //       });
  //       this.lastMouseMoveTarget = null;
  //       this.lastEmittedMouseEnter = null;
  //     }
  //   }
  // }

  // public _onMouseLeave(e: EditorMouseEvent): void {
  //   this.lastMouseLeaveTime = (new Date()).getTime();
  //   this.viewController.emitMouseLeave({
  //     event: e,
  //     target: null
  //   });
  // }

  public _onMouseUp(e: CanvasMouseEvent): void {
    let t = this._createMouseTarget(e, { hitTestLevel: this.viewHelper.getHitTestLevel(InputEventType.MOUSE_UP) });
    this.mousePressed = false;

    const x = e.browserEvent.pageX;
    const y = e.browserEvent.pageY;
    if (isNumber(this.lastClickPosX) && isNumber(this.lastClickPosY)) {
      if (Math.abs(x - this.lastClickPosX) > 5 || Math.abs(y - this.lastClickPosY) > 5) {
        this.multiClickCount = 0;
      }
      this.lastClickPosX = x;
      this.lastClickPosY = y;
    }

    if (this.multiClickCount && (e.timestamp - this.lastClickTimeStamp) < MouseHandler.DoubleClickInterval) {
      // One more multiclick;
      this.multiClickCount++;
    } else {
      this.lastClickTimeStamp = e.timestamp;
      this.multiClickCount = 1;
    }

    // 要告诉下游是哪个键松开了
    switch (this.multiClickCount) {
      case 1:
        this.viewController.emitMouseUp(createMouseEvent(InputEventType.MOUSE_UP, e, t, this.lastEmittedMouseDownButtons));
        break;
      case 2:
        this.viewController.emitMouseUp(createMouseEvent(InputEventType.MOUSE_UP, e, t, this.lastEmittedMouseDownButtons));
        // dblclick fires after two click events (and by extension, after two pairs of mousedown and mouseup events).
        this.viewController.emitDbClick(createMouseEvent(InputEventType.DBLCLICK, e, t, this.lastEmittedMouseDownButtons));
        break;
      default:
        this.multiClickCount = 0;
        break;
    }
  }

  createKeyboardEvent(type: typeof InputEventType.KEY_DOWN | typeof InputEventType.KEY_UP, e: IKeyboardEvent): IKeyboardInputEvent {
    return new KeyboardInputEvent(type, e);
  }

  private lastEmittedMouseDownButtons: number = 0;
  public _onMouseDown(e: CanvasMouseEvent, pointerId: number): void {
    // this tries to make sure another mouse press event doesn't happen
    // before a release event happens
    if (this.mousePressed) {
      DLOG(WARNING);
    }

    const t = this._createMouseTarget(e, { hitTestLevel: this.viewHelper.getHitTestLevel(InputEventType.MOUSE_DOWN) });
    this.viewController.emitMouseDown(createMouseEvent(InputEventType.MOUSE_DOWN, e, t));
    e.preventDefault();
    this._mouseDownOperation.start(t.type, e, pointerId);

    this.mousePressed = true;
    this.lastEmittedMouseDownButtons = e.buttons;
  }

  public _onMouseWheel(e: IMouseWheelEvent): void {
    this.viewController.emitMouseWheel(new WheelInputEvent(e));
  }

  _onKeyDown(e: IKeyboardEvent) {
    this.viewController.emitKeyDown(this.createKeyboardEvent(InputEventType.KEY_DOWN, e));
  }

  _onKeyUp(e: IKeyboardEvent) {
    this.viewController.emitKeyUp(this.createKeyboardEvent(InputEventType.KEY_UP, e));
  }
}

class MouseDownOperation extends Disposable {
  // private readonly _context: ViewContext;
  private readonly _viewController: ViewController;
  private readonly _viewHelper: IPointerHandlerHelper;
  private readonly _createMouseTarget: (e: CanvasMouseEvent, testEventTarget: boolean) => IMouseTarget;

  private readonly _mouseMoveMonitor: GlobalEditorPointerMoveMonitor;
  private readonly _mouseState: MouseDownState;

  private _isActive: boolean;
  private _lastMouseEvent: CanvasMouseEvent | null;
  private _lastMouseTarget: Optional<IMouseTarget>;

  constructor(
    // context: ViewContext,
    viewController: ViewController,
    viewHelper: IPointerHandlerHelper,
    createMouseTarget: (e: CanvasMouseEvent, testEventTarget: boolean) => IMouseTarget,
    private _onCancelled: () => void,
    // getMouseColumn: (e: EditorMouseEvent) => number
  ) {
    super();
    // this._context = context;
    this._viewController = viewController;
    this._viewHelper = viewHelper;
    this._createMouseTarget = createMouseTarget;

    this._mouseMoveMonitor = this._register(new GlobalEditorPointerMoveMonitor(this._viewHelper));
    this._mouseState = new MouseDownState();

    this._isActive = false;
    this._lastMouseEvent = null;
  }

  public isActive(): boolean {
    return this._isActive;
  }

  private _onMouseDownThenMove(e: CanvasMouseEvent): void {
    this._lastMouseEvent = e;
    this._mouseState.setModifiers(e);

    if (this._mouseState.isDragAndDrop) {
      this._lastMouseTarget = this._createMouseTarget(e, true);
      this._viewController.emitMouseDrag(createMouseEvent(InputEventType.DRAG, e, this._lastMouseTarget));
      this._viewController.emitMouseMove(createMouseEvent(InputEventType.MOUSE_MOVE, e, this._lastMouseTarget));
    } else {
      NOTREACHED();
      // this._dispatchMouse(position, true);
    }
  }

  public start(targetType: MouseTargetType, e: CanvasMouseEvent, pointerId: number): void {
    this._lastMouseEvent = e;

    this._mouseState.setModifiers(e);

    this._mouseState.trySetCount(e.detail, { x: e.pos.x, y: e.pos.y });

    // Overwrite the detail of the MouseEvent, as it will be sent out in an event and contributions might rely on it.
    e.detail = this._mouseState.count;

    if (
      !this._mouseState.altKey && // we don't support multiple mouse
      e.detail < 2 && // only single click on a selection can work
      !this._isActive // the mouse is not down yet
    ) {
      this._mouseState.isDragAndDrop = true;
      this._isActive = true;

      this._lastMouseTarget = this._createMouseTarget(e, true);
      this._viewController.emitMouseDragStart(createMouseEvent(InputEventType.DRAG_START, e, this._lastMouseTarget!));
      this._mouseMoveMonitor.startMonitoring(
        this._viewHelper.viewDomNode,
        pointerId,
        e.buttons,
        createMouseMoveEventMerger(),
        (e) => this._onMouseDownThenMove(e),
        (browserEvent?: MouseEvent | KeyboardEvent) => {
          if (!browserEvent || (browserEvent && browserEvent instanceof KeyboardEvent)) {
            // cancel
            this._viewController.emitMouseDropCanceled(createMouseEvent(InputEventType.DRAG_END, this._lastMouseEvent!, this._lastMouseTarget!, e.buttons));
            this._onCancelled();
          } else {
            this._viewController.emitMouseDrop(createMouseEvent(InputEventType.DROP, this._lastMouseEvent!, this._lastMouseTarget!));
          }

          this._stop();
          this._lastMouseTarget = undefined;
        },
      );
    }
  }

  private _stop(): void {
    this._isActive = false;
  }

  public onPointerUp(): void {
    this._mouseMoveMonitor.stopMonitoring();
  }
}

class MouseDownState {
  private static readonly CLEAR_MOUSE_DOWN_COUNT_TIME = 400; // ms

  private _altKey: boolean;
  public get altKey(): boolean {
    return this._altKey;
  }

  private _ctrlKey: boolean;
  public get ctrlKey(): boolean {
    return this._ctrlKey;
  }

  private _metaKey: boolean;
  public get metaKey(): boolean {
    return this._metaKey;
  }

  private _shiftKey: boolean;
  public get shiftKey(): boolean {
    return this._shiftKey;
  }

  private _leftButton: boolean;
  public get leftButton(): boolean {
    return this._leftButton;
  }

  private _middleButton: boolean;
  public get middleButton(): boolean {
    return this._middleButton;
  }

  private _lastMouseDownPosition: { x: number; y: number } | null;
  private _lastMouseDownPositionEqualCount: number;
  private _lastMouseDownCount: number;
  private _lastSetMouseDownCountTime: number;
  public isDragAndDrop: boolean;

  constructor() {
    this._altKey = false;
    this._ctrlKey = false;
    this._metaKey = false;
    this._shiftKey = false;
    this._leftButton = false;
    this._middleButton = false;
    this._lastMouseDownPosition = null;
    this._lastMouseDownPositionEqualCount = 0;
    this._lastMouseDownCount = 0;
    this._lastSetMouseDownCountTime = 0;
    this.isDragAndDrop = false;
  }

  public get count(): number {
    return this._lastMouseDownCount;
  }

  public setModifiers(source: CanvasMouseEvent) {
    this._altKey = source.altKey;
    this._ctrlKey = source.ctrlKey;
    this._metaKey = source.metaKey;
    this._shiftKey = source.shiftKey;
  }

  public setStartButtons(source: CanvasMouseEvent) {
    this._leftButton = source.leftButton;
    this._middleButton = source.middleButton;
  }

  public trySetCount(setMouseDownCount: number, newMouseDownPosition: { x: number; y: number }): void {
    // a. Invalidate multiple clicking if too much time has passed (will be hit by IE because the detail field of mouse events contains garbage in IE10)
    const currentTime = new Date().getTime();
    if (currentTime - this._lastSetMouseDownCountTime > MouseDownState.CLEAR_MOUSE_DOWN_COUNT_TIME) {
      setMouseDownCount = 1;
    }
    this._lastSetMouseDownCountTime = currentTime;

    // b. Ensure that we don't jump from single click to triple click in one go (will be hit by IE because the detail field of mouse events contains garbage in IE10)
    if (setMouseDownCount > this._lastMouseDownCount + 1) {
      setMouseDownCount = this._lastMouseDownCount + 1;
    }

    // c. Invalidate multiple clicking if the logical position is different
    if (this._lastMouseDownPosition && this._lastMouseDownPosition === newMouseDownPosition) {
      this._lastMouseDownPositionEqualCount++;
    } else {
      this._lastMouseDownPositionEqualCount = 1;
    }
    this._lastMouseDownPosition = newMouseDownPosition;

    // Finally set the lastMouseDownCount
    this._lastMouseDownCount = Math.min(setMouseDownCount, this._lastMouseDownPositionEqualCount);
  }
}
