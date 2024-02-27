import { URI } from '../../../base/common/uri';
import {
  IUndoRedoElement,
  IUndoRedoService,
} from './undoRedo';
import { registerSingleton } from '../../instantiation/common/extensions';
import { IModelService } from '../../model/common/model';
import { NOTIMPLEMENTED } from '../../../base/common/notreached';

export class UndoRedoService implements IUndoRedoService {
  declare readonly _serviceBrand: undefined;

  constructor(@IModelService private modelService: IModelService) {
  }

  public canUndo(resourceOrSource: URI): boolean {
    return NOTIMPLEMENTED();
    // const m = this.modelService.getModel(resourceOrSource)
    // DCHECK(m)
    // return m.canRedo()
  }

  public undo(resourceOrSource: URI): Promise<void> | void {
    return NOTIMPLEMENTED();
    // const m = this.modelService.getModel(resourceOrSource)
    // DCHECK(m)
    // return m.undo()
  }

  public canRedo(resourceOrSource: URI): boolean {
    return NOTIMPLEMENTED();
    // const m = this.modelService.getModel(resourceOrSource)
    // DCHECK(m)
    // return m.canRedo()
  }

  public redo(resourceOrSource: URI): Promise<void> | void {
    return NOTIMPLEMENTED();
    // const m = this.modelService.getModel(resourceOrSource)
    // DCHECK(m)
    // return m.redo()
  }
  pushElement(element: IUndoRedoElement): void {
    NOTIMPLEMENTED();
  }
  removeElements(resource: URI): void {
    NOTIMPLEMENTED();
  }
}

registerSingleton(IUndoRedoService, UndoRedoService);
