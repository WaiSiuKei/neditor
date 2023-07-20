import { ServicesAccessor } from '@neditor/core/platform/instantiation/common/instantiation';
import { CanvasElement } from '../element/types';
import { ICanvasView } from '../view/view';
import { IEventFilter } from '@neditor/core/platform/input/browser/event';
import { ICanvasModel, INodeInit, IOperationCallback } from '../../platform/model/common/model';
import { Event } from '../../base/common/event';
import { Optional } from '../../base/common/typescript';
import { Scope, ScopedIdentifier } from '../canvasCommon/scope';
import { IDocumentModel } from '../../common/model';
import { IScopedLocation } from '../../platform/model/common/location';
import { IBlockNodeModel, INodeModel, IRootNodeModel, ITextNodeModel } from '../../common/node';
import { ICanvasViewModel } from '../viewModel/viewModel';
import { URI } from '../../base/common/uri';
import { IModelContentChangedEvent } from '../../platform/model/common/modelEvents';

export interface GitHistory {
  /**
   * 需要对 model 进行多次修改、一次记录的话，先调用这个，类似 github fork repo 的概念
   * 可以通过增加symbol来指定对应有效的commit操作
   */
  fork(symbol?: symbol): void;
  /**
   * 在 fork 版本上添加修改，类似 git add 的效果
   */
  add(callback: IOperationCallback<unknown>): void;
  /**
   * 对 fork 版本的改动进行合并，类似 github 提 PR，只产生一条记录
   */
  commitAndMerge(symbol?: symbol): void;
  /**
   * 对 fork 版本的改动进行废弃，这个 fork 版本也随之消失
   */
  checkout(): void;
  /**
   * 提交一次修改、产生一次记录，类似于 git 里面的单独 commit
   * model 变动与 viewModel selection 的变更操作尽量放到这个 callback 里
   * 否则，这个 cb 以外的 viewModel selection 变动不会被记录
   * @param cb
   */
  transform<T>(cb: IOperationCallback<T>): T;
}

export interface IMVVMStatus {
  maybeWaitForReLayout(): Promise<void>;
}

export interface ICanvasState {
  readonly selectedElements: readonly CanvasElement[];
  setSelectedElements(els: readonly  CanvasElement[]): void;
  zoom: number;
}

export interface ICanvas extends GitHistory, ICanvasState {
  readonly _serviceBrand: undefined;

  id: string;
  readonly model: ICanvasModel;
  readonly viewModel: ICanvasViewModel;
  readonly view: ICanvasView;
  readonly mvvm: IMVVMStatus;

  onDidChangeModel: Event<IModelChangedEvent>;
  onDidChangeModelContent: Event<IModelContentChangedEvent>;

  setModel(model: Optional<ICanvasModel>): void;
  updateModel(val: IDocumentModel): void;
  getScopedModel(scope: Scope): ICanvasModel;

  installEventFilter(filter: IEventFilter): void;

  invokeWithinContext<T>(fn: (accessor: ServicesAccessor) => T): T;

  focus(): void;
  isFocused(): boolean;

  canUndo(): boolean;
  undo(): void;
  canRedo(): boolean;
  redo(): void;

  getElementAtPosition(
    x: number,
    y: number,
  ): CanvasElement | null;
}

interface IScopedTextNodeModel extends ITextNodeModel, IScopedMixin {
}

interface IScopedBlockNodeModel extends IBlockNodeModel, IScopedMixin {
}

interface IScopedRootNodeModel extends IRootNodeModel, IScopedMixin {
}

export type IScopedNodeModel = IScopedTextNodeModel | IScopedBlockNodeModel | IScopedRootNodeModel

export interface IScopedMixin {
  scope: Scope;
}

export interface IModelFacade {
  addNode(at: IScopedLocation, init: INodeInit): IScopedNodeModel;
  /**
   * 删除节点
   * @param at - 位置
   */
  removeNode(at: IScopedLocation): void;
  /**
   * 删除多个节点
   * @param ids
   */
  removeNodes(ids: ScopedIdentifier[]): void;
  /**
   * 改变节点的父元素
   * @param id
   * @param newParent
   * @param referenceNodeId - 新位置后面的兄弟节点的 id； null 代表作为最后一个元素
   */
  reparentNode(id: ScopedIdentifier, newParent: ScopedIdentifier, referenceNodeId?: Optional<ScopedIdentifier>): void;
  /**
   * 移动目标节点
   * @param id - 目标节点
   * @param beforeSiblingNodeId - 新位置后面的兄弟节点的 id； null 代表作为最后一个元素
   */
  reorderNode(id: ScopedIdentifier, beforeSiblingNodeId?: Optional<ScopedIdentifier>): void;

  updateNodeById(target: ScopedIdentifier, props: Partial<INodeInit>): void;

  /**
   * 根据 id 获取节点数据
   */
  getNodeById(id: ScopedIdentifier): Optional<IScopedNodeModel>;
  /**
   * 获取父节点
   */
  getParentNodeOfId(id: ScopedIdentifier): Optional<IScopedNodeModel>;
  /**
   * 获取相邻前节点
   */
  getPreviousSiblingNodeOfId(id: ScopedIdentifier): Optional<IScopedNodeModel>;
  /**
   * 获取相邻后节点
   */
  getNextSiblingNodeOfId(id: ScopedIdentifier): Optional<IScopedNodeModel>;
  /**
   * 获取祖先节点列表，根节点在前
   * @param id - 查询的节点的 id
   */
  getAncestorNodesOfId(id: ScopedIdentifier): IScopedNodeModel[]; // root 在最前
  getNodePathInTree(i: ScopedIdentifier, includeSelf?: boolean): ScopedIdentifier[];
  /**
   * 是否为祖先节点
   * @param ancestorId - 查询的节点的 id
   * @param id - 被查询的节点的 id
   */
  isAncestorNodeOfId(ancestorId: ScopedIdentifier, id: ScopedIdentifier): boolean;
  getChildrenNodesOfId(ID: ScopedIdentifier): IScopedNodeModel[];
  /**
   * 获取符合条件的节点列表
   */
  // queryNodes(condition: (s: Scope, n: INodeModel) => boolean): IScopedNodeModel[];
}

/**
 * An event describing that an editor has had its model reset (i.e. `editor.setModel()`).
 */
export interface IModelChangedEvent {
  /**
   * The `uri` of the previous model or null.
   */
  readonly oldModelUrl: URI | null;
  /**
   * The `uri` of the new model or null.
   */
  readonly newModelUrl: URI | null;
}
