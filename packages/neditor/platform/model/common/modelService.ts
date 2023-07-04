import { URI } from '../../../base/common/uri';
import { Disposable, IDisposable } from '../../../base/common/lifecycle';
import { ICanvasModel, IModelChangeParticipant, IModelService, UpdateMode } from './model';
import { Emitter, Event } from '../../../base/common/event';
import { ModelChangeParticipant } from './modelChangeParticipant';
import { IInstantiationService } from '../../instantiation/common/instantiation';
import { IDocumentModel } from '../../../common/model';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../base/common/notreached';
import { IModelContentChangedEvent } from './modelEvents';
import { Optional } from '../../../base/common/typescript';
import { UndoRedoSource } from '../../undoRedo/common/undoRedo';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { ICanvasService } from '../../canvas/common/canvas';
import { CanvasModel } from './modelImpl';
import { registerSingleton } from '../../instantiation/common/extensions';
import * as Y from "yjs";

function MODEL_ID(resource: URI): string {
  return resource.toString();
}

class DisposedModelInfo {
  constructor(
    public readonly uri: URI,
    // public readonly initialUndoRedoSnapshot: ResourceEditStackSnapshot | null,
    public readonly time: number, // public readonly sharesUndoRedoStack: boolean, // public readonly heapSize: number, // public readonly sha1: string, // public readonly versionId: number, // public readonly alternativeVersionId: number,
  ) {
  }
}

export class ModelService extends Disposable implements IModelService {
  // public static MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK = 20 * 1024 * 1024;
  public _serviceBrand: undefined;
  private id = performance.now();
  doc = new Y.Doc();

  private readonly _onModelAdded: Emitter<ICanvasModel> = this._register(new Emitter<ICanvasModel>());

  public readonly onModelAdded: Event<ICanvasModel> = this._onModelAdded.event;
  private readonly _onModelRemoved: Emitter<ICanvasModel> = this._register(new Emitter<ICanvasModel>());

  public readonly onModelRemoved: Event<ICanvasModel> = this._onModelRemoved.event;

  /**
   * All the models known in the system.
   */
  private readonly _models = new Map<string, ICanvasModel>();
  // protected readonly fragments = new Map<string, FragmentModel>();
  private readonly _disposedModels: Map<string, DisposedModelInfo>;
  private _disposedModelsHeapSize: number;

  private modelChangeParticipant: ModelChangeParticipant;

  // 简单的批量更新模式嵌套管理, beginUpdate 入栈，endUpdate 出栈
  protected updateStackDepth = 0;
  public updateMode = UpdateMode.None;
  private modelVersionBeforeChange = new Map<ICanvasModel, number>();

  constructor(@IInstantiationService private instantiationService: IInstantiationService) {
    super();
    this._disposedModels = new Map<string, DisposedModelInfo>();
    this._disposedModelsHeapSize = 0;
    this.modelChangeParticipant = new ModelChangeParticipant();
  }

  public updateModel(model: ICanvasModel, value: IDocumentModel): void {
    this.instantiationService.invokeFunction(accessor => {
      const canvasesService = accessor.get(ICanvasService);
      const editors = canvasesService.listCanvases();
      const editor = editors.find(e => e.model === model);
      if (!editor) {
        return;
      }
      NOTIMPLEMENTED();
      // editor.replaceModel(value);
      this.reset();
    });
    // Otherwise find a diff between the values and update model
    // model.pushStackElement();
    // model.pushEOL(textBuffer.getEOL() === '\r\n' ? EndOfLineSequence.CRLF : EndOfLineSequence.LF);
    // model.pushEditOperations([], ModelService._computeEdits(model, textBuffer), () => []);
    // model.pushStackElement();
    // disposable.dispose();
  }

  public createModel(value: IDocumentModel, resource?: URI): ICanvasModel {
    const model = this._doCreateModel(value, resource);

    this._onModelAdded.fire(model);

    return model;
  }

  private _doCreateModel(value: IDocumentModel, resource: URI | undefined): ICanvasModel {
    // create & save the model
    const model = this.instantiationService.createInstance(CanvasModel, value, this.doc, resource);
    if (resource && this._disposedModels.has(MODEL_ID(resource))) {
      NOTIMPLEMENTED();
    }
    const modelId = MODEL_ID(model.uri);

    if (this._models.has(modelId)) {
      // There already exists a model with this id => this is a programmer error
      throw new Error('ModelService: Cannot add model because it already exists!');
    }

    model.onWillDispose(() => this._onWillDispose(model));
    this._models.set(modelId, model);

    return model;
  }

  public destroyModel(resource: URI): void {
    // We need to support that not all models get disposed through this service (i.e. model.dispose() should work!)
    const model = this._models.get(MODEL_ID(resource));
    if (!model) {
      return;
    }
    model.dispose();
  }

  public getModel(resource: URI) {
    const modelId = MODEL_ID(resource);
    return this._models.get(modelId);
  }

  private _onWillDispose(model: ICanvasModel): void {
    const modelId = MODEL_ID(model.uri);
    this._models.delete(modelId);
    this._onModelRemoved.fire(model);
  }

  addChangeParticipant(participant: IModelChangeParticipant): IDisposable {
    return this.modelChangeParticipant.addSaveParticipant(participant);
  }

  runChangeParticipants(model: ICanvasModel, changes: IModelContentChangedEvent) {
    this.modelChangeParticipant.participate(model, changes);
  }

  getModelUniversally(resourceStr: string): Optional<ICanvasModel> {
    return this._models.get(resourceStr);
  }

  getAllModels(): ICanvasModel[] {
    const m: ICanvasModel[] = Array.from(this._models.values());
    return m;
  }

  beginUpdate(): void {
    this.updateStackDepth++;
  }

  endUpdate(): void {
    this.updateStackDepth--;
  }

  isUpdating(): boolean {
    return this.updateStackDepth > 0;
  }

  reset() {
    this.updateStackDepth = 0;
    this.updateMode = UpdateMode.None;
  }

  private _forkSymbol: Optional<symbol>;
  private _beforeCursorState: Optional<ScopedIdentifier[]>;
  private _sessionSource: Optional<UndoRedoSource>;
  fork(undoRedoSource: UndoRedoSource, cursorState: ScopedIdentifier[], symbol?: symbol): void {
    if (this._forkSymbol) return;
    // 如果正在更新 model，不允许 fork
    if (this.isUpdating()) {
      NOTREACHED();
    }

    if (symbol) {
      this._forkSymbol = symbol;
    }

    // 这是处理 add 了还没有 merge 就继续 fork 的情况
    if (this.updateMode === UpdateMode.Add) {
      this.commitAndMerge(this._sessionSource!, cursorState);
    }

    for (const model of this.getAllModels()) {
      this.modelVersionBeforeChange.set(model, model.getVersionId());
    }
    this._beforeCursorState = cursorState.slice();
    this._sessionSource = undoRedoSource;
  }

  add(callback: () => void): void {
    if (this.updateMode === UpdateMode.None) {
      this.updateMode = UpdateMode.Add;
    } else if (this.updateMode === UpdateMode.Transform) {
      NOTREACHED();
    }

    this.doUpdate(callback);
  }

  commitAndMerge(undoRedoSource: UndoRedoSource, cursorState: ScopedIdentifier[], symbol?: symbol): void {
    if (this._forkSymbol && symbol !== this._forkSymbol) {
      return;
    }
    this._forkSymbol = undefined;
    this.updateMode = UpdateMode.None;
  }

  checkout(): void {
    this._forkSymbol = undefined;
    this.updateMode = UpdateMode.None;
  }

  transform<T>(undoRedoSource: UndoRedoSource, cb: () => T, beforeCursorState: ScopedIdentifier[], getAfterCursorState: () => ScopedIdentifier[]) {
    // 这是处理 add 了还没有 merge 就继续 transform 的情况
    if (this.updateMode === UpdateMode.Add) {
      this.commitAndMerge(this._sessionSource!, beforeCursorState);
    }
    if (this.updateMode === UpdateMode.None) {
      this.updateMode = UpdateMode.Transform;
    } else if (this.updateMode === UpdateMode.Transform) {
      throw new Error('400');
    }
    const ret = this.doUpdate(cb);
    this.updateMode = UpdateMode.None;
    return ret;
  }

  changeWithoutHistory<T>(cb: () => T): T {
    return this.doUpdate(cb);
  }

  private doUpdate<T>(cb: () => T) {
    this.beginUpdate();

    let ret = this.doc.transact(() => {
      try {
        return cb();
      } catch (e) {
        console.error(e);
        NOTREACHED();
      }
    })
    this.endUpdate();

    return ret;
  }
}

registerSingleton(IModelService, ModelService);
