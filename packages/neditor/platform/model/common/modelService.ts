import { URI } from '../../../base/common/uri';
import { Disposable, IDisposable } from '../../../base/common/lifecycle';
import { IUndoRedoService } from '../../undoRedo/common/undoRedo';
import { SingleModelEditStackElement } from './editorStack';
import { IDocumentModel, IModelChangeParticipant, IModelService, UpdateMode } from './model';
import { Emitter, Event } from '../../../base/common/event';
import { ModelChangeParticipant } from './modelChangeParticipant';
import { IInstantiationService } from '../../instantiation/common/instantiation';
import { IDocument } from '../../../common/record';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../base/common/notreached';
import { IModelContentChangedEvent } from './modelEvents';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { ICanvasService } from '../../canvas/common/canvas';
import { DocumentModel } from './modelImpl';
import { registerSingleton } from '../../instantiation/common/extensions';
import { Patch, produce } from './reactivity/patch';
import { toRaw } from './reactivity/reactive';

function MODEL_ID(resource: URI): string {
  return resource.toString();
}

class DisposedModelInfo {
  constructor(
    public readonly uri: URI,
    public readonly time: number, // public readonly sharesUndoRedoStack: boolean, // public readonly heapSize: number, // public readonly sha1: string, // public readonly versionId: number, // public readonly alternativeVersionId: number,
  ) {
  }
}

export class ModelService extends Disposable implements IModelService {
  // public static MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK = 20 * 1024 * 1024;
  public _serviceBrand: undefined;
  private id = performance.now();

  private readonly _onModelAdded: Emitter<IDocumentModel> = this._register(new Emitter<IDocumentModel>());

  public readonly onModelAdded: Event<IDocumentModel> = this._onModelAdded.event;
  private readonly _onModelRemoved: Emitter<IDocumentModel> = this._register(new Emitter<IDocumentModel>());

  public readonly onModelRemoved: Event<IDocumentModel> = this._onModelRemoved.event;

  /**
   * All the models known in the system.
   */
  private readonly _models = new Map<string, IDocumentModel>();
  private readonly _disposedModels: Map<string, DisposedModelInfo>;
  private _disposedModelsHeapSize: number;

  private modelChangeParticipant: ModelChangeParticipant;

  // 简单的批量更新模式嵌套管理, beginUpdate 入栈，endUpdate 出栈
  protected updateStackDepth = 0;
  public updateMode = UpdateMode.None;
  private changesGroupedByModel = new Map<IDocumentModel, Patch[]>();
  private modelVersionBeforeChange = new Map<IDocumentModel, number>();

  constructor(@IInstantiationService private instantiationService: IInstantiationService) {
    super();
    this._disposedModels = new Map<string, DisposedModelInfo>();
    this._disposedModelsHeapSize = 0;
    this.modelChangeParticipant = new ModelChangeParticipant();
  }

  public updateModel(model: IDocumentModel,
                     value: IDocument): void {
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
  }

  public createModel(value: IDocument,
                     resource?: URI): IDocumentModel {
    const model = this._doCreateModel(value, resource);

    this._onModelAdded.fire(model);

    return model;
  }

  private _doCreateModel(value: IDocument,
                         resource: URI | undefined): IDocumentModel {
    // create & save the model
    const model = this.instantiationService.createInstance(DocumentModel, value, resource);
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

  private _onWillDispose(model: IDocumentModel): void {
    const modelId = MODEL_ID(model.uri);
    this._models.delete(modelId);
    this._onModelRemoved.fire(model);
  }

  addChangeParticipant(participant: IModelChangeParticipant): IDisposable {
    return this.modelChangeParticipant.addSaveParticipant(participant);
  }

  runChangeParticipants(model: IDocumentModel,
                        changes: IModelContentChangedEvent) {
    this.modelChangeParticipant.participate(model, changes);
  }

  beginUpdate(): void {
    this.updateStackDepth++;
  }

  endUpdate(): void {
    this.updateStackDepth--;
  }

  isInRecursion(): boolean {
    return this.updateStackDepth > 1;
  }

  isUpdating(): boolean {
    return this.updateStackDepth > 0;
  }

  reset() {
    this.updateStackDepth = 0;
    this.updateMode = UpdateMode.None;
  }

  transform<T>(cb: () => T,
               beforeCursorState: ScopedIdentifier[],
               getAfterCursorState: () => ScopedIdentifier[]): T {
    if (this.updateMode === UpdateMode.None) {
      this.updateMode = UpdateMode.Transform;
    } else if (this.updateMode === UpdateMode.Transform) {
      // 嵌套
      return this.doUpdate(cb);
    }
    const ret = this.doUpdate(cb);
    this.commitEditStack(beforeCursorState, getAfterCursorState());
    this.changesGroupedByModel.clear();
    this.updateMode = UpdateMode.None;
    return ret;
  }

  changeWithoutHistory(cb: () => void): void {
    this.doUpdate(cb);
  }

  private commitEditStack(beforeScursorState: ScopedIdentifier[],
                          afterCursorState: ScopedIdentifier[]) {
    this.instantiationService.invokeFunction(accessor => {
      const singleEdits = [];
      for (const [model, changes] of this.changesGroupedByModel) {
        if (changes.length) {
          const e = new SingleModelEditStackElement(model.uri.toString(), model, beforeScursorState);
          e.append(changes, model.getVersionId(), afterCursorState);
          singleEdits.push(e);
        }
      }

      if (!singleEdits.length) return;
      const undoRedoService = accessor.get<IUndoRedoService>(IUndoRedoService);

      if (singleEdits.length === 1) {
        undoRedoService.pushElement(singleEdits[0]);
      } else {
        NOTIMPLEMENTED();
      }
    });
  }

  private doUpdate<T>(cb: () => T) {
    this.beginUpdate();

    if (!this.isInRecursion()) {
      this.changesGroupedByModel.clear();
      this._models.forEach(i => {
        this.changesGroupedByModel.set(i, []);
      });
      this._models.forEach(model => {
        model.beforeMutation();
      });
    }

    let ret: T | undefined;
    const patches = produce(() => {
      // catch cb 报错，避免后续操作不执行
      try {
        ret = cb();
      } catch (e) {
        console.error(e);
      }
    });

    const allModels = Array.from(this._models.values());
    for (const p of patches) {
      const m = allModels.find(model => toRaw(model.document) === toRaw(p.root));
      if (!m) NOTREACHED();
      const arr = this.changesGroupedByModel.get(m);
      if (!arr) NOTREACHED();
      arr.push(p);
    }

    if (!this.isInRecursion()) {
      for (const [model, changes] of this.changesGroupedByModel) {
        model.afterMutation(changes);
      }
    }

    this.endUpdate();
    return ret!;
  }
}

registerSingleton(IModelService, ModelService);
