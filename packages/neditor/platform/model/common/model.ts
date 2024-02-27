import { Event } from '../../../base/common/event';
import { IDisposable } from '../../../base/common/lifecycle';
import { Optional } from '../../../base/common/typescript';
import { URI } from '../../../base/common/uri';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { IAncestorNode, IDescendantNode, IModelNode, IRootNode, } from '../../../common/node';
import { IIdentifier } from '../../../common/record/common';
import { IDocument, IDocumentRecord, ITextRecord, IBlockRecord, IFragmentRecord } from '../../../common/record';
import { ITypedRecord } from '../../../common/record/types/base';
import { createDecorator } from '../../instantiation/common/instantiation';
import { IModelContentChangedEvent } from './modelEvents';
import { Patch } from './reactivity/patch';

export const IModelService = createDecorator<IModelService>('modelService');

export const RootNodeId = 'root';

export enum UpdateMode {
  None,
  Transform,
}

type AttrsShouldBeBlank = 'id' | 'from' | 'order'
type AttrsCanBeBlank = 'top' | 'left' | 'width' | 'height'
type BoxModel = Pick<ITypedRecord, AttrsCanBeBlank>
export type ITypedNodeInit<T extends ITypedRecord> = Omit<T, AttrsShouldBeBlank> & Partial<BoxModel>
export type IBlockNodeInit = ITypedNodeInit<IBlockRecord>
export type ITextNodeInit = ITypedNodeInit<ITextRecord>
export type IFragmentNodeInit = ITypedNodeInit<IFragmentRecord>
export type INodeInit = IBlockNodeInit | ITextNodeInit | IFragmentNodeInit

export interface IDocumentModel<T extends IDocument = IDocument> extends IDisposable {
  readonly uri: URI;
  readonly document: T;
  readonly onDidChangeContent: Event<IModelContentChangedEvent>;
  readonly onWillDispose: Event<void>;
  /**
   * Get the current version id of the model.
   * Anytime a change happens to the model (even undo/redo),
   * the version id is incremented.
   */
  getVersionId(): number;

  /**
   * Get the alternative version id of the model.
   * This alternative version id is not always incremented,
   * it will return the same values in the case of undo-redo.
   */
  getAlternativeVersionId(): number;
  beforeMutation(): void;
  afterMutation(patches: Patch[]): void;

  addNode(n: IDescendantNode): void;
  removeNode(n: IDescendantNode): void;
  getNodeById(id: IIdentifier): Optional<IModelNode>;
  getRoot(): IRootNode;
  // getPreviousSiblingNodeOfId(id: IIdentifier): Optional<IDescendantNode>;
  // getNextSiblingNodeOfId(id: IIdentifier): Optional<IDescendantNode>;
  // getAncestorNodesOfId(id: IIdentifier): IAncestorNode[]; // root 在最前
  // isAncestorNodeOfId(ancestorId: IIdentifier,
  //                    id: IIdentifier): boolean;
}

export interface IModelHistoryContext {
  transform<T>(
    cb: () => T,
    beforeCursorState?: ScopedIdentifier[],
    getAfterCursorState?: () => ScopedIdentifier[],
  ): T;
  changeWithoutHistory(cb: () => void): void;
}

export interface IModelOperationContext {
  updateMode: UpdateMode;

  isUpdating(): boolean;
}

export interface IModelService extends IModelOperationContext, IModelHistoryContext {
  readonly _serviceBrand: undefined;

  createModel(value: IDocument,
              resource?: URI): IDocumentModel;

  updateModel(model: IDocumentModel,
              value: IDocument): void;

  destroyModel(resource: URI): void;

  getModel(resource: URI): Optional<IDocumentModel>;

  onModelAdded: Event<IDocumentModel>;

  onModelRemoved: Event<IDocumentModel>;

  addChangeParticipant(participant: IModelChangeParticipant): IDisposable;
  runChangeParticipants(model: IDocumentModel,
                        changes: IModelContentChangedEvent): void;
}

export interface IModelChangeParticipant {
  /**
   * Participate in a save of a model. Allows to change the model
   * before it is being saved to disk.
   */
  participate(model: IDocumentModel,
              changes: IModelContentChangedEvent): void;
}

export interface IOperationCallback<T extends any> {
  (model: IDocumentModel): T;
}
