import { Disposable, IDisposable } from '@neditor/core/base/common/lifecycle';
import { CanvasMouseEvent, EditorMouseEventMerger } from '../view/controller/mouseEventFactory';
import { GlobalPointerMoveMonitor } from '@neditor/core/base/browser/globalPointerMoveMonitor';
import { addStandardDisposableListener, IEventMerger } from '@neditor/core/base/browser/dom';
import { IPointerHandlerHelper } from '../view/controller/mouseHandler';

export class GlobalEditorPointerMoveMonitor extends Disposable {

  private readonly _globalPointerMoveMonitor: GlobalPointerMoveMonitor<CanvasMouseEvent>;
  private _keydownListener: IDisposable | null;

  constructor(private viewHelper: IPointerHandlerHelper) {
    super();
    this._globalPointerMoveMonitor = this._register(new GlobalPointerMoveMonitor<CanvasMouseEvent>());
    this._keydownListener = null;
  }

  get _editorViewDomNode() {
    return this.viewHelper.viewDomNode;
  }

  public startMonitoring(
    initialElement: Element,
    pointerId: number,
    initialButtons: number,
    merger: EditorMouseEventMerger,
    pointerMoveCallback: (e: CanvasMouseEvent) => void,
    onStopCallback: (browserEvent?: PointerEvent | KeyboardEvent) => void
  ): void {

    // Add a <<capture>> keydown event listener that will cancel the monitoring
    // if something other than a modifier key is pressed
    this._keydownListener = addStandardDisposableListener(<any>document, 'keydown', (e) => {
      const kb = e.toKeybinding();
      if (kb.isModifierKey()) {
        // Allow modifier keys
        return;
      }
      this._globalPointerMoveMonitor.stopMonitoring(true, e.browserEvent);
    }, true);

    const myMerger: IEventMerger<CanvasMouseEvent, PointerEvent> = (lastEvent: CanvasMouseEvent | null, currentEvent: PointerEvent): CanvasMouseEvent => {
      return merger(lastEvent, new CanvasMouseEvent(currentEvent, true, this._editorViewDomNode, this.viewHelper.getTransform()));
    };

    this._globalPointerMoveMonitor.startMonitoring(initialElement, pointerId, initialButtons, myMerger, pointerMoveCallback, (e) => {
      this._keydownListener!.dispose();
      onStopCallback(e);
    });
  }

  public stopMonitoring(e: PointerEvent): void {
    this._globalPointerMoveMonitor.stopMonitoring(true, e);
  }
}
