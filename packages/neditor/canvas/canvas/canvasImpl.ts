import { isArrayShallowEqual } from '../../base/common/array';
import { DeferredPromise } from '../../base/common/async';
import { TextToolID } from '../../workbench/contrib/tool/text/textTool';
import { begin, end } from '../canvasCommon/scheduler';
import { hitTest } from '../element/collision';
import { CanvasElement } from '../element/types';
import { getElementsAtPosition } from '../scene/comparisons';
import { ICanvas, IModelChangedEvent, IMVVMStatus } from './canvas';
import { Disposable, dispose, IDisposable } from '@neditor/core/base/common/lifecycle';
import { ICanvasView } from '../view/view';
import { ServiceCollection } from '@neditor/core/platform/instantiation/common/serviceCollection';
import { IInstantiationService, ServicesAccessor } from '@neditor/core/platform/instantiation/common/instantiation';
import { View } from '../view/viewImpl';
import { ViewOutgoingEvents } from '../view/viewOutgoingEvents';
import { Optional } from '@neditor/core/base/common/typescript';
import { IEventFilter, InputEvents, } from '@neditor/core/platform/input/browser/event';
import { IToolService } from '@neditor/core/platform/tool/common/tool';
import { ICanvasService } from '../../platform/canvas/common/canvas';
import { NOTIMPLEMENTED, NOTREACHED } from '../../base/common/notreached';
import { ICanvasModel, IModelService, IOperationCallback, RootNodeId } from '../../platform/model/common/model';
import { RootScope, Scope } from '../canvasCommon/scope';
import { ICanvasViewModel } from '../viewModel/viewModel';
import { Emitter, Event } from '../../base/common/event';
import { isNil } from '../../base/common/type';
import { IDocumentModel } from '../../common/model';
import { CanvasViewModel } from '../viewModel/viewModelImpl';
import { HistoryHelper } from './historyHelper';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey';
import { IInputService } from '../../platform/input/common/inputService';
import { CanvasContextKeys } from './canvasContextKeys';
import { IModelContentChangedEvent } from '../../platform/model/common/modelEvents';

class MVVMStatus extends Disposable implements IMVVMStatus {
  protected _pendingReLayout = true;
  protected _waiting: Optional<DeferredPromise<void>>;
  constructor(model: ICanvasModel) {
    super();
    this._register(model.onDidChangeContent(() => {
      this._pendingReLayout = true;
    }));

  }
  setView(view: ICanvasView) {
    this._register(view.layoutManager.onDidLayout(() => {
      this._pendingReLayout = false;
      this._waiting?.complete();
    }));
  }

  async maybeWaitForReLayout() {
    if (!this._pendingReLayout) {
      return;
    }
    if (!this._waiting) {
      this._waiting = new DeferredPromise<void>();
    }
    await this._waiting;
  }
}

class ModelData {
  public readonly model: ICanvasModel;
  public readonly viewModel: ICanvasViewModel;
  public readonly view: ICanvasView;
  public readonly mvvm: MVVMStatus;
  public readonly listenersToRemove: IDisposable[];

  constructor(model: ICanvasModel, viewModel: ICanvasViewModel, view: ICanvasView, mvvm: MVVMStatus, listenersToRemove: IDisposable[]) {
    this.model = model;
    this.viewModel = viewModel;
    this.view = view;
    this.mvvm = mvvm;
    this.listenersToRemove = listenersToRemove;
  }

  public dispose(): void {
    dispose(this.listenersToRemove);
    // this.model.onBeforeDetached();
    this.view.dispose();
    this.viewModel.dispose();
    this.mvvm.dispose();
  }
}

export class Canvas extends Disposable implements ICanvas {
  static counter = 0;
  declare _serviceBrand: undefined;
  _contextKeyService: IContextKeyService;
  _instantiationService: IInstantiationService;

  private _modelData: Optional<ModelData>;
  private _historyHelper!: HistoryHelper;

  protected readonly _onDidChangeModel: Emitter<IModelChangedEvent> = this._register(new Emitter<IModelChangedEvent>());
  public readonly onDidChangeModel: Event<IModelChangedEvent> = this._onDidChangeModel.event;
  protected readonly _onDidChangeModelContent: Emitter<IModelContentChangedEvent> = this._register(new Emitter<IModelContentChangedEvent>());
  public readonly onDidChangeModelContent: Event<IModelContentChangedEvent> = this._onDidChangeModelContent.event;

  eventFilter: Optional<IEventFilter>;
  id = (Canvas.counter++).toString();

  constructor(
    private _domElement: HTMLElement,
    @IInstantiationService instantiationService: IInstantiationService,
    @ICanvasService canvasesService: ICanvasService,
    @IInputService inputService: IInputService,
    @IToolService toolService: IToolService,
    @IModelService private modelService: IModelService,
    @IContextKeyService private contextKeyService: IContextKeyService,
  ) {
    super();

    this._contextKeyService = this._register(contextKeyService.createScoped(this._domElement));
    const serviceCollection = new ServiceCollection();
    serviceCollection.set(IContextKeyService, this._contextKeyService);
    this._register(this._instantiationService = instantiationService.createChild(serviceCollection));
    // this.modelUpdater = new ModelUpdater(this);
    this._register(new CanvasContextKeysManager(this, contextKeyService, toolService));

    inputService.addTrackedCanvas(this);
    canvasesService.addCanvas(this);

    Reflect.set(window, 'canvas', this);
  }
  protected _attachModel(model: Optional<ICanvasModel>): void {
    if (!model) {
      this._modelData = undefined;
      return;
    }

    const listenersToRemove: IDisposable[] = [];
    listenersToRemove.push(model.onDidChangeContent((e) => this._onDidChangeModelContent.fire(e)));

    const viewModel = new CanvasViewModel(model, this._instantiationService, this.modelService, this);
    // Someone might destroy the model from under the editor, so prevent any exceptions by setting a null model
    listenersToRemove.push(model.onWillDispose(() => this.setModel(undefined)));

    const mvvm = new MVVMStatus(model);
    const view = this._createView(viewModel);
    mvvm.setView(view);
    view.domNode.setAttribute('data-uri', model.uri.toString());

    this._modelData = new ModelData(model, viewModel, view, mvvm, listenersToRemove);
    this._historyHelper = this._instantiationService.createInstance(HistoryHelper, model);
  }

  protected _createView(vm: ICanvasViewModel): ICanvasView {
    const viewUserInputEvents = new ViewOutgoingEvents();
    const eventCallback = this.passToEventFilter.bind(this);
    let view: ICanvasView;
    viewUserInputEvents.onContextMenu = eventCallback;
    viewUserInputEvents.onMouseMove = e => {
      if (this.passToEventFilter(e)) return;
    };
    viewUserInputEvents.onMouseLeave = eventCallback;
    viewUserInputEvents.onMouseEnter = eventCallback;
    viewUserInputEvents.onMouseDown = eventCallback;
    viewUserInputEvents.onMouseUp = eventCallback;
    viewUserInputEvents.onMouseDrag = eventCallback;
    viewUserInputEvents.onMouseDragStart = eventCallback;
    viewUserInputEvents.onMouseDrop = eventCallback;
    viewUserInputEvents.onMouseDropCanceled = eventCallback;
    viewUserInputEvents.onDoubleClick = eventCallback;
    viewUserInputEvents.onMouseWheel = eventCallback;
    viewUserInputEvents.onKeyDown = eventCallback;
    viewUserInputEvents.onKeyUp = eventCallback;
    viewUserInputEvents.onMouseDragStart = eventCallback;
    viewUserInputEvents.onMouseDrag = eventCallback;
    viewUserInputEvents.onMouseDropCanceled = eventCallback;
    viewUserInputEvents.onMouseDrop = eventCallback;

    view = this._instantiationService.createInstance(View, this._domElement, vm, viewUserInputEvents);
    return view;
  }

  public invokeWithinContext<T>(fn: (accessor: ServicesAccessor) => T): T {
    return this._instantiationService.invokeFunction(fn);
  }

  installEventFilter(filter: IEventFilter) {
    this.eventFilter = filter;
  }
  passToEventFilter(e: InputEvents): boolean {
    if (this.eventFilter) {
      this.eventFilter.eventFilter(e);
      return e.isAccepted();
    }
    return false;
  }

  get model() {
    return this._modelData?.model!;
  }
  get viewModel() {
    return this._modelData?.viewModel!;
  }
  get view() {
    return this._modelData?.view!;
  }
  get mvvm() {
    return this._modelData?.mvvm!;
  }

  private _detachModel(): ICanvasModel | null {
    if (!this._modelData) {
      return null;
    }
    const model = this._modelData.model;
    const removeDomNode = this._modelData.view ? this._modelData.view.domNode : null;

    this.viewModel!.internal_disconnect(model.uri.toString());
    this.view!.internal_disconnect();

    this._modelData?.dispose();
    this._modelData = undefined;

    if (removeDomNode && this._domElement.contains(removeDomNode)) {
      this._domElement.removeChild(removeDomNode);
    }

    return model;
  }

  canUndo(): boolean {
    return Boolean(this._historyHelper?.canUndo());
  }
  canRedo(): boolean {
    return Boolean(this._historyHelper?.canRedo());
  }
  undo() {
    if (!this._historyHelper) NOTREACHED();
    return this._historyHelper.undo();
  }
  redo() {
    if (!this._historyHelper) NOTREACHED();
    return this._historyHelper.redo();
  }

  transform<T>(cb: IOperationCallback<T>) {
    if (!this._historyHelper) NOTREACHED();
    try {
      begin();
      return this._historyHelper.transform(cb);
    } finally {
      end();
      this.view.layoutManager.DoLayoutAndProduceRenderTree();
    }
  }

  getScopedModel(scope: Scope): ICanvasModel {
    if (scope.EQ(RootScope)) return this.model!;
    debugger;
    NOTIMPLEMENTED();
    // let m: ICanvasModel = this.model!;
    // for (const s of scope) {
    //   if (s.EQ(RootScope)) continue;
    //   const node = m.getNodeById(s.name)!;
    //   m = this.modelService.getModelUniversally(node.props.fragmentSrc!)!;
    // }
    // return m;
  }
  focus() {
    this.view.focus();
  }
  isFocused(): boolean {
    return this.view.isFocused();
  }
  setModel(model: Optional<ICanvasModel>): void {
    if (isNil(this._modelData) && isNil(model)) {
      // Current model is the new model
      return;
    }
    if (this._modelData && this._modelData.model === model) {
      // Current model is the new model
      return;
    }

    const detachedModel = this._detachModel();
    this._attachModel(model);

    const e: IModelChangedEvent = {
      oldModelUrl: detachedModel ? detachedModel.uri : null,
      newModelUrl: model ? model.uri : null,
    };

    this._onDidChangeModel.fire(e);
  }
  updateModel(value: IDocumentModel): void {
    this.viewModel!.internal_disconnect(this.model!.uri.toString());
    this.view!.internal_disconnect();
    this.model!.replaceModel(value);
    this.viewModel!.internal_connect(this.model!.uri.toString(), true);
    this.view!.internal_connect();
  }

  getElementAtPosition(
    x: number,
    y: number,
    // opts?: {
    //   /** if true, returns the first selected element (with highest z-index)
    //    of all hit elements */
    //   preferSelected?: boolean;
    // },
  ): CanvasElement | null {
    const allHitElements = this.getElementsAtPosition(
      x,
      y,
    );
    if (allHitElements.length > 1) {
      NOTIMPLEMENTED();
      // if (opts?.preferSelected) {
      //   for (let index = allHitElements.length - 1; index > -1; index--) {
      //     if (this.state.selectedElementIds[allHitElements[index].id]) {
      //       return allHitElements[index];
      //     }
      //   }
      // }
      // const elementWithHighestZIndex =
      //   allHitElements[allHitElements.length - 1];
      // // If we're hitting element with highest z-index only on its bounding box
      // // while also hitting other element figure, the latter should be considered.
      // return isHittingElementBoundingBoxWithoutHittingElement(
      //   elementWithHighestZIndex,
      //   this.state,
      //   this.frameNameBoundsCache,
      //   x,
      //   y,
      // )
      //   ? allHitElements[allHitElements.length - 2]
      //   : elementWithHighestZIndex;
    }
    if (allHitElements.length === 1) {
      return allHitElements[0];
    }
    return null;
  }

  private getElementsAtPosition(
    x: number,
    y: number,
  ): CanvasElement[] {
    const tier1Nodes = this.model.getChildrenNodesOfId(RootNodeId);
    const elements = tier1Nodes.map(n => this.view.document.getElementById(n.id)!);

    return getElementsAtPosition(elements, (element) => hitTest(element, this, x, y,),);
  }
  setSelectedElements(els: CanvasElement[]) {
    let prev = this.selectedElements;
    this.selectedElements = els;
    if (!isArrayShallowEqual(prev, this.selectedElements)) {
      this.view.reflowOverlay(this);
    }
  }

  reflow() {
    this.view.reflow();
    this.view.reflowOverlay(this);
  }

  //#region canvasState
  selectedElements: CanvasElement[] = [];
  get zoom() {
    return this.view.zoom;
  }
  //#endregion
}

class CanvasContextKeysManager extends Disposable {
  constructor(canvas: Canvas, contextKeyService: IContextKeyService, toolService: IToolService) {
    super();

    CanvasContextKeys.hitTestLevel.bindTo(contextKeyService);
    const isEditingText = CanvasContextKeys.isEditingText.bindTo(contextKeyService);
    toolService.onDidChangeTool(e => {
      const { next } = e;
      isEditingText.set(next?.id === TextToolID);
    });
  }
}
