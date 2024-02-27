import { NOTIMPLEMENTED } from '../../base/common/notreached';
import { IDocumentModel, IModelService, IOperationCallback } from '../../platform/model/common/model';

export class HistoryHelper {
  constructor(private model: IDocumentModel,
              @IModelService private modelService: IModelService) {
  }

  canUndo() {
    return NOTIMPLEMENTED();
  }

  canRedo() {
    return NOTIMPLEMENTED();
  }

  undo() {
    return NOTIMPLEMENTED();
  }

  redo() {
    return NOTIMPLEMENTED();
  }

  transform<T>(cb: IOperationCallback<T>) {
    return this.modelService.transform(cb.bind(null, this.model), [], () => []);
  }
}
