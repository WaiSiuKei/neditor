import { Optional } from '../../../base/common/typescript';
import { URI } from '../../../base/common/uri';
import { ModelOperator } from './modelOperator';
import { IDocumentModel } from '../../../common/model';
import { ICanvasModel, IModelService } from './model';
import { NOTIMPLEMENTED } from "../../../base/common/notreached";
import * as Y from 'yjs';

export class CanvasModel extends ModelOperator<IDocumentModel> implements ICanvasModel {
  constructor(rawModel: IDocumentModel, doc: Y.Doc, associatedResource: Optional<URI>, @IModelService modelService: IModelService) {
    super(rawModel, doc, associatedResource, modelService);
  }
  replaceModel(rawModel: IDocumentModel): void {
    NOTIMPLEMENTED()
    // this._doc = this._processInput(rawModel);
  }
}
