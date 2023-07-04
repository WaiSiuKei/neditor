import './view.css';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Optional } from '@neditor/core/base/common/typescript';
import { Selection } from '@neditor/core/engine/editing/selection';
import { HitTestOptions, DOMHitTestResult, LayoutManager } from '@neditor/core/engine/layout/layout_manager';
import { Emitter, Event } from '../../base/common/event';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey';
import { TInputEventType } from '../../platform/input/browser/event';
import { HitTestLevel } from '../../platform/input/common/input';
import { IKeybindingService } from '../../platform/keybinding/common/keybinding';
import { IMVVMStatus } from '../canvas/canvas';
import { CanvasContextKeys } from '../canvas/canvasContextKeys';
import { ICanvasViewModel } from '../viewModel/viewModel';
import { IPointerHandlerHelper } from './controller/mouseHandler';
import { PointerHandler } from './controller/pointerHandler';
import { CursorUpdater } from './cursorUpdater';
import { Canvas } from './parts/canvas/canvas';
import { TextCursor } from './parts/cursor/textCursor';
import { Overlay } from './parts/overlay/overlay';
import { SelectionOverlay } from './parts/selection/selectionOverlay';
import { CursorStyle, IPhysicalCursorPosition, ICanvasView, IOutlineInit } from './view';
import { ViewController } from './viewController';
import { ViewOutgoingEvents } from './viewOutgoingEvents';

export class View extends Disposable implements ICanvasView {
  private _textCursor: TextCursor;
  private _canvas: Canvas;
  private _overlay: Overlay;
  private _selection!: Selection;
  private _selectionOverlay!: SelectionOverlay;

  private _onCursorMoved = new Emitter<Optional<IPhysicalCursorPosition>>();
  public onCursorMoved = this._onCursorMoved.event;

  constructor(
    public domNode: HTMLElement,
    public viewModel: ICanvasViewModel,
    public mvvm: IMVVMStatus,
    viewUserInputEvents: ViewOutgoingEvents,
    @IContextKeyService private _contextKeyService: IContextKeyService,
    @IKeybindingService private _keybindingService: IKeybindingService,
  ) {
    super();
    Reflect.set(window, 'view', this);

    this.domNode.tabIndex = 1;
    let viewController = new ViewController(viewUserInputEvents);
    this._canvas = this._register(new Canvas(this.domNode, viewModel));
    this._overlay = this._register(new Overlay(this.domNode));
    this._textCursor = this._register(new TextCursor(this.domNode));
    Event.once(this._canvas.onMounted)(() => {
      const selection = this.document.getSelection();
      this._register(new CursorUpdater(this, this.mvvm));
      this._selection = this._register(selection);
      this._selectionOverlay = this._register(new SelectionOverlay(this.domNode, this._selection, this.layoutManager, mvvm));
      this._register(new PointerHandler(viewController, this._createPointerHandlerHelper()));
    });
  }

  get mx() {
    return this._canvas.mx;
  }

  get document() {
    return this._canvas.document;
  }

  private _createPointerHandlerHelper(): IPointerHandlerHelper {
    return {
      viewDomNode: this.domNode,
      hitTest: (posx: number, posy: number, opt: HitTestOptions): DOMHitTestResult[] => {
        return this.hitTest(posx, posy, opt);
      },
      getTransform: () => {
        return this._canvas.mx;
      },
      getHitTestLevel: (eventType: TInputEventType) => {
        return this._contextKeyService.getContextKeyValue<HitTestLevel>(CanvasContextKeys.hitTestLevel.key)!;
      }
    };
  }

  get layoutManager(): LayoutManager {
    return this._canvas.layoutManager;
  }

  hitTest(posx: number, posy: number, opt: HitTestOptions): DOMHitTestResult[] {
    return this.layoutManager.hitTestDOM(posx, posy, opt);
  }

  currentCursor(): CursorStyle {
    return (this.domNode.style.cursor || CursorStyle.arrow) as CursorStyle;
  }
  setCursor(toSet: CursorStyle): void {
    const target = this.domNode;
    const cursor = target.style.cursor;
    if (cursor !== toSet) {
      target.style.cursor = toSet;
    }
  }
  drawCursor(position: Optional<IPhysicalCursorPosition>): void {
    if (!position) {
      this._textCursor.update();
    } else {
      this._textCursor.update({
        left: position.blockStart,
        top: position.inlineStart,
        width: 1.5,
        height: position.inlineSize,
      });
    }
    this._onCursorMoved.fire(position);
  }

  setOutlines(outlines: IOutlineInit[]) {
    this._overlay.outlines.length = 0;
    this._overlay.outlines.push(...outlines);
  }
  setHitTestLevel(level: HitTestLevel) {
    this._contextKeyService.setContext(CanvasContextKeys.hitTestLevel.key, level);
  }

  translate(tx: number, ty: number) {
    this._canvas.translate(tx, ty);
  }

  internal_disconnect() {
    NOTIMPLEMENTED();
  }

  internal_connect() {
    NOTIMPLEMENTED();
  }

  focus() {
    this.domNode.focus();
  }

  public isFocused(): boolean {
    return document.activeElement === this.domNode;
  }

  disposed = false;
  dispose() {
    super.dispose();
    this.disposed = true;
  }
}
