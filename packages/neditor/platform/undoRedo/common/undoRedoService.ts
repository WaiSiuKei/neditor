import { URI } from "../../../base/common/uri";
import {
  IUndoRedoService,
  UndoRedoSource
} from "./undoRedo";
import { registerSingleton } from "../../instantiation/common/extensions";
import { IModelService } from "../../model/common/model";
import { NOTIMPLEMENTED } from "../../../base/common/notreached";
import { DCHECK } from "../../../base/check";


export class UndoRedoService implements IUndoRedoService {
  declare readonly _serviceBrand: undefined;

  constructor(@IModelService private modelService: IModelService) {
  }

  public canUndo(resourceOrSource: URI | UndoRedoSource): boolean {
    if (UndoRedoSource.isInstance(resourceOrSource)) {
      NOTIMPLEMENTED()
    }
    const m = this.modelService.getModel(resourceOrSource)
    DCHECK(m)
    return m.canRedo()
  }

  public undo(resourceOrSource: URI | UndoRedoSource): Promise<void> | void {
    if (UndoRedoSource.isInstance(resourceOrSource)) {
      NOTIMPLEMENTED()
    }
    const m = this.modelService.getModel(resourceOrSource)
    DCHECK(m)
    return m.undo()
  }

  public canRedo(resourceOrSource: URI | UndoRedoSource): boolean {
    if (UndoRedoSource.isInstance(resourceOrSource)) {
      NOTIMPLEMENTED()
    }
    const m = this.modelService.getModel(resourceOrSource)
    DCHECK(m)
    return m.canRedo()
  }

  public redo(resourceOrSource: URI | UndoRedoSource): Promise<void> | void {
    if (UndoRedoSource.isInstance(resourceOrSource)) {
      NOTIMPLEMENTED()
    }
    const m = this.modelService.getModel(resourceOrSource)
    DCHECK(m)
    return m.redo()
  }
}

registerSingleton(IUndoRedoService, UndoRedoService);
