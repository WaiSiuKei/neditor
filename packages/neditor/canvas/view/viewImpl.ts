import './view.css';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Selection } from '@neditor/core/engine/editing/selection';
import { HitTestOptions, DOMHitTestResult, LayoutManager } from '@neditor/core/engine/layout/layout_manager';
import { Emitter, Event } from '../../base/common/event';
import { Matrix } from '../../base/common/geometry';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey';
import { TInputEventType } from '../../platform/input/browser/event';
import { HitTestLevel } from '../../platform/input/common/input';
import { IKeybindingService } from '../../platform/keybinding/common/keybinding';
import { ICanvasState } from '../canvas/canvas';
import { CanvasContextKeys } from '../canvas/canvasContextKeys';
import { ICanvasViewModel } from '../viewModel/viewModel';
import { IPointerHandlerHelper } from './controller/mouseHandler';
import { PointerHandler } from './controller/pointerHandler';
import { Canvas } from './parts/canvas/canvas';
import { Overlay } from './parts/overlay/overlay';
import { CursorStyle, ICanvasView } from './view';
import { ViewController } from './viewController';
import { ViewOutgoingEvents } from './viewOutgoingEvents';

export class View extends Disposable implements ICanvasView {
  private _canvas: Canvas;
  private _overlay: Overlay;
  private _selection!: Selection;
  mx = Matrix.Identity;
  get zoom() {return this.mx.a;}

  private _onCameraChagned = new Emitter<void>();
  public onCameraChagned = this._onCameraChagned.event;

  constructor(
    public domNode: HTMLElement,
    public viewModel: ICanvasViewModel,
    viewUserInputEvents: ViewOutgoingEvents,
    @IContextKeyService private _contextKeyService: IContextKeyService,
    @IKeybindingService private _keybindingService: IKeybindingService,
  ) {
    super();
    Reflect.set(window, 'view', this);

    this.domNode.tabIndex = 1;
    let viewController = new ViewController(viewUserInputEvents);
    this._canvas = this._register(new Canvas(this.domNode, this, viewModel));
    this._overlay = this._register(new Overlay(this.domNode));
    Event.once(this._canvas.onMounted)(() => {
      const selection = this.document.getSelection();
      this._selection = this._register(selection);
      this._register(selection.onDidChange(() => this.layoutManager.onSelectionChanged(selection)));
      this._register(new PointerHandler(viewController, this._createPointerHandlerHelper()));
    });
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
        return this.mx;
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

  setHitTestLevel(level: HitTestLevel) {
    this._contextKeyService.setContext(CanvasContextKeys.hitTestLevel.key, level);
  }

  translate(tx: number, ty: number) {
    this.mx.tx = tx;
    this.mx.ty = ty;
    this._onCameraChagned.fire();
  }

  reflowOverlay(state: ICanvasState) {
    this._overlay.reflow(state);
  }

  reflow() {
    this._canvas.layoutManager.DoLayoutAndProduceRenderTree();
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
