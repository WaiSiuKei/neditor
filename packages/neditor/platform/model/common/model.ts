import { Optional } from '../../../base/common/typescript';
import { IDocumentModel, IYDocumentModel } from '../../../common/model';
import { URI } from '../../../base/common/uri';
import { Event } from '../../../base/common/event';
import { IModelContentChangedEvent } from './modelEvents';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { IBlockNodeModel, IFragmentNodeModel, INodeModel, IRootNodeModel, ITextNodeModel, YNode, NodeType, NodeModelProxy } from '../../../common/node';
import { IIdentifier } from '../../../common/common';
import { ILocation } from './location';
import { createDecorator } from '../../instantiation/common/instantiation';
import { IDisposable } from '../../../base/common/lifecycle';
import { UndoRedoSource } from '../../undoRedo/common/undoRedo';
import * as Y from 'yjs';

export const IModelService = createDecorator<IModelService>('modelService');

export const RootNodeId = 'root';

export enum UpdateMode {
  None,
  Transform,
}

type AttrsShouldBeBlank = 'id' | 'from' | 'order'
export type IBlockNodeInit = Omit<IBlockNodeModel, AttrsShouldBeBlank>
export type ITextNodeInit = Omit<ITextNodeModel, AttrsShouldBeBlank>
export type IFragmentNodeInit = Omit<IFragmentNodeModel, AttrsShouldBeBlank>
export type INodeInit = IBlockNodeInit | ITextNodeInit | IFragmentNodeInit

export interface IModelBase<T extends IDocumentModel> extends IDisposable {
  readonly uri: URI;
  readonly onDidChangeContent: Event<IModelContentChangedEvent>;
  undoManager: Y.UndoManager;
  yModel: IYDocumentModel;
  getValue(): T;

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

  /**
   * An event emitted right before disposing the model.
   */
  readonly onWillDispose: Event<void>;

  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  /**
   * 添加节点，待定
   */
  addNode(at: ILocation, nodeInit: INodeInit): NodeModelProxy;
  _internal_addNode(at: ILocation, nodeInit: INodeInit): YNode;
  /**
   * 删除节点
   * @param at - 位置
   */
  removeNode(at: ILocation): void;
  /**
   * 删除多个节点
   * @param ids
   */
  removeNodes(ids: IIdentifier[]): void;
  /**
   * 改变节点的父元素
   * @param id
   * @param newParent
   * @param referenceNodeId - 新位置后面的兄弟节点的 id； null 代表作为最后一个元素
   */
  reparentNode(id: IIdentifier, newParent: IIdentifier, referenceNodeId?: Optional<IIdentifier>): void;
  /**
   * 移动目标节点
   * @param id - 目标节点
   * @param beforeSiblingNodeId - 新位置后面的兄弟节点的 id； null 代表作为最后一个元素
   */
  reorderNode(id: IIdentifier, beforeSiblingNodeId?: Optional<IIdentifier>): void;
  /**
   * 根据 id 获取节点数据
   */
  getNodeById(id: IIdentifier): Optional<NodeModelProxy>;
  _internal_getNodeById(id: IIdentifier): Optional<YNode>;
  getChildrenNodesOfId(id: IIdentifier): NodeModelProxy[];
  _internal_getChildrenNodesOfId(id: IIdentifier): YNode[];
  /**
   * 获取父节点
   */
  getParentNodeOfId(id: IIdentifier): Optional<NodeModelProxy>;
  _internal_getParentNodeOfId(id: IIdentifier): Optional<YNode>;
  /**
   * 获取相邻前节点
   */
  getPreviousSiblingNodeOfId(id: IIdentifier): Optional<NodeModelProxy>;
  _internal_getPreviousSiblingNodeOfId(id: IIdentifier): Optional<YNode>;
  /**
   * 获取相邻后节点
   */
  getNextSiblingNodeOfId(id: IIdentifier): Optional<NodeModelProxy>;
  _internal_getNextSiblingNodeOfId(id: IIdentifier): Optional<YNode>;
  /**
   * 获取祖先节点列表，根节点在前
   * @param id - 查询的节点的 id
   */
  getAncestorNodesOfId(id: IIdentifier): NodeModelProxy[]; // root 在最前
  _internal_getAncestorNodesOfId(id: IIdentifier): YNode[];
  /**
   * 是否为祖先节点
   * @param ancestorId - 查询的节点的 id
   * @param id - 被查询的节点的 id
   */
  isAncestorNodeOfId(ancestorId: IIdentifier, id: IIdentifier): boolean;
}

export interface ICanvasModel extends IModelBase<IDocumentModel> {
  replaceModel(newModel: IDocumentModel): void;
}

export type ICanvasModelLike = IModelBase<IDocumentModel>

export interface IModelHistoryContext {
  /**
   * 提交一次修改、产生一次记录，类似于 git 里面的单独 commit
   */
  transform<T>(
    undoRedoSource: UndoRedoSource,
    cb: () => T,
    beforeCursorState: ScopedIdentifier[],
    getAfterCursorState: () => ScopedIdentifier[],
  ): T;
}

export interface IModelOperationContext {
  updateMode: UpdateMode;

  isUpdating(): boolean;
}

export interface IModelService extends IModelOperationContext, IModelHistoryContext {
  readonly _serviceBrand: undefined;
  doc: Y.Doc;

  createModel(value: IDocumentModel, resource?: URI): ICanvasModel;

  updateModel(model: ICanvasModelLike, value: IDocumentModel): void;

  destroyModel(resource: URI): void;

  getModel(resource: URI): Optional<ICanvasModelLike>;

  onModelAdded: Event<ICanvasModelLike>;

  onModelRemoved: Event<ICanvasModelLike>;

  addChangeParticipant(participant: IModelChangeParticipant): IDisposable;
  runChangeParticipants(model: ICanvasModelLike, changes: IModelContentChangedEvent): void;

  getModelUniversally(resourceStr: string): Optional<ICanvasModelLike>;
}

export interface IModelChangeParticipant {
  /**
   * Participate in a save of a model. Allows to change the model
   * before it is being saved to disk.
   */
  participate(model: ICanvasModelLike, changes: IModelContentChangedEvent): void;
}

export interface IOperationCallback<T extends any> {
  (model: ICanvasModelLike): T;
}
