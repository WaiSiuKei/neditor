import { isArrayShallowEqual } from '../../base/common/array';
import { ILayoutService } from '../../platform/layout/common/layout';
import { LayoutService } from '../../platform/layout/common/layoutService';
import { TextToolID } from '../../workbench/contrib/tool/text/textTool';
import { begin, end } from '../canvasCommon/scheduler';
import { ICanvas, IModelChangedEvent } from './canvas';
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
import { IDocumentModel, IModelService, IOperationCallback, RootNodeId } from '../../platform/model/common/model';
import { Emitter, Event } from '../../base/common/event';
import { isNil } from '../../base/common/type';
import { IDocument } from '../../common/record';
import { HistoryHelper } from './historyHelper';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey';
import { IInputService } from '../../platform/input/common/inputService';
import { CanvasContextKeys } from './canvasContextKeys';
import { IModelContentChangedEvent } from '../../platform/model/common/modelEvents';

class ModelData {
  public readonly model: IDocumentModel;
  public readonly view: ICanvasView;
  public readonly listenersToRemove: IDisposable[];

  constructor(model: IDocumentModel,
              view: ICanvasView,
              listenersToRemove: IDisposable[]
  ) {
    this.model = model;
    this.view = view;
    this.listenersToRemove = listenersToRemove;
  }

  public dispose(): void {
    dispose(this.listenersToRemove);
    this.model.dispose();
    this.view.dispose();
  }
}

export class Canvas extends Disposable implements ICanvas {
  static counter = 0;
  _contextKeyService: IContextKeyService;
  _instantiationService: IInstantiationService;
  _layoutService: ILayoutService;

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
    this._register(this._layoutService = this._instantiationService.createInstance(LayoutService, this));
    this._register(new CanvasContextKeysManager(this, contextKeyService, toolService));

    inputService.addTrackedCanvas(this);
    canvasesService.addCanvas(this);

    Reflect.set(window, 'canvas', this);
  }
  protected _attachModel(model: Optional<IDocumentModel>): void {
    if (!model) {
      this._modelData = undefined;
      return;
    }

    const listenersToRemove: IDisposable[] = [];
    listenersToRemove.push(model.onDidChangeContent((e) => this._onDidChangeModelContent.fire(e)));
    listenersToRemove.push(model.onWillDispose(() => this.setModel(undefined)));
    this._layoutService.sync(model);
    const view = this._createView();
    view.domNode.setAttribute('data-uri', model.uri.toString());

    this._modelData = new ModelData(model, view, listenersToRemove);
    this._historyHelper = this._instantiationService.createInstance(HistoryHelper, model);
  }

  protected _createView(): ICanvasView {
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

    view = this._instantiationService.createInstance(View, this._domElement, viewUserInputEvents);
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
  get view() {
    return this._modelData?.view!;
  }

  private _detachModel(): IDocumentModel | null {
    if (!this._modelData) {
      return null;
    }
    const model = this._modelData.model;
    const removeDomNode = this._modelData.view ? this._modelData.view.domNode : null;

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
    }
  }

  focus() {
    this.view.focus();
  }
  isFocused(): boolean {
    return this.view.isFocused();
  }
  setModel(model: Optional<IDocumentModel>): void {
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
  updateModel(value: IDocument): void {
    NOTIMPLEMENTED();
    // this.viewModel!.internal_disconnect(this.model!.uri.toString());
    // this.view!.internal_disconnect();
    // this.model!.replaceModel(value);
    // this.viewModel!.internal_connect(this.model!.uri.toString(), true);
    // this.view!.internal_connect();
  }

  reflow() {
    this.view.reflow();
    this.view.reflowOverlay(this);
  }

  //#region canvasState
  get zoom() {
    return this.view.zoom;
  }
  //#endregion
}

class CanvasContextKeysManager extends Disposable {
  constructor(canvas: Canvas,
              contextKeyService: IContextKeyService,
              toolService: IToolService) {
    super();

    CanvasContextKeys.hitTestLevel.bindTo(contextKeyService);
    const isEditingText = CanvasContextKeys.isEditingText.bindTo(contextKeyService);
    toolService.onDidChangeTool(e => {
      const { next } = e;
      isEditingText.set(next?.id === TextToolID);
    });
  }
}
