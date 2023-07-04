import { GitHistory } from './canvas';
import { Optional } from '../../base/common/typescript';
import { UndoRedoSource } from '../../platform/undoRedo/common/undoRedo';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation';
import { ICanvasModel, IModelService, IOperationCallback } from '../../platform/model/common/model';
import { ICanvasService } from '../../platform/canvas/common/canvas';
import { ICanvasViewModel } from '../viewModel/viewModel';

export class HistoryHelper implements GitHistory {
  private undoRedoSource: UndoRedoSource;
  constructor(private model: ICanvasModel,
              @IInstantiationService private instantiationService: IInstantiationService,
              @ICanvasService private canvasesService: ICanvasService,
              @IModelService private modelService: IModelService) {
    this.undoRedoSource = new UndoRedoSource();
  }

  canUndo() {
    return this.model.canUndo()
  }

  canRedo() {
    return this.model.canRedo()
  }

  undo() {
    return this.model.undo()
  }

  redo() {
    return this.model.redo()
  }

  add(callback: IOperationCallback<unknown>): void {
    this.modelService.add(callback.bind(null, this.model));
  }

  checkout(): void {
    this.modelService.checkout();
  }

  commitAndMerge(symbol?: symbol) {
    this.modelService.commitAndMerge(this.undoRedoSource, [], symbol);
  }

  fork(symbol?: symbol): void {
    this.modelService.fork(this.undoRedoSource, [], symbol);
  }

  transform<T>(cb: IOperationCallback<T>) {
    return this.modelService.transform(this.undoRedoSource, cb.bind(null, this.model), [], () => []);
  }

  getVM(): Optional<ICanvasViewModel> {
    const editor = this.canvasesService.listCanvases().find(e => e.model!.uri.toString() === this.model.uri.toString());
    return editor?.viewModel;
  }
}
