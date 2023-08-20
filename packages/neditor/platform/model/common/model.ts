import { isPlainObject } from 'is-plain-object';
import * as Y from 'yjs';
import { DCHECK } from '../../../base/check';
import { tail } from '../../../base/common/array';
import { devideBy2, plus } from '../../../base/common/bignumber';
import { Event } from '../../../base/common/event';
import { IDisposable } from '../../../base/common/lifecycle';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../base/common/notreached';
import { isNil, isString } from '../../../base/common/type';
import { EnumAndLiteral, Optional, ValueOf } from '../../../base/common/typescript';
import { URI } from '../../../base/common/uri';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { IIdentifier } from '../../../common/common';
import { IDocumentModel, IYDocumentModel } from '../../../common/model';
import { getNodeContent, getNodeFrom, getNodeId, getNodeOrder, getNodeStyle, getNodeType, IBlockNodeModel, IFragmentNodeModel, IRootNodeModel, ITextNodeModel, NodeType, YNode } from '../../../common/node';
import { IBlockStyleDeclaration, IInlineStyleDeclaration, IStyleDeclaration } from '../../../common/style';
import { createDecorator } from '../../instantiation/common/instantiation';
import { UndoRedoSource } from '../../undoRedo/common/undoRedo';
import { DirectionType, ILocation } from './location';
import { IModelContentChangedEvent } from './modelEvents';

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
  addNode(at: ILocation, nodeInit: INodeInit): DescendantModelProxy;
  _internal_addNode(at: ILocation, nodeInit: INodeInit): YNode;
  /**
   * 删除节点
   * @param at - 位置
   */
  removeNode(at: ILocation): void;
  removeEmptyTextNodes(): void;
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
  getChildrenNodesOfId(id: IIdentifier): DescendantModelProxy[];
  _internal_getChildrenNodesOfId(id: IIdentifier): YNode[];
  /**
   * 获取父节点
   */
  getParentNodeOfId(id: IIdentifier): Optional<AncestorModelProxy>;
  _internal_getParentNodeOfId(id: IIdentifier): Optional<YNode>;
  /**
   * 获取相邻前节点
   */
  getPreviousSiblingNodeOfId(id: IIdentifier): Optional<DescendantModelProxy>;
  _internal_getPreviousSiblingNodeOfId(id: IIdentifier): Optional<YNode>;
  /**
   * 获取相邻后节点
   */
  getNextSiblingNodeOfId(id: IIdentifier): Optional<DescendantModelProxy>;
  _internal_getNextSiblingNodeOfId(id: IIdentifier): Optional<YNode>;
  /**
   * 获取祖先节点列表，根节点在前
   * @param id - 查询的节点的 id
   */
  getAncestorNodesOfId(id: IIdentifier): AncestorModelProxy[]; // root 在最前
  _internal_getAncestorNodesOfId(id: IIdentifier): YNode[];
  /**
   * 是否为祖先节点
   * @param ancestorId - 查询的节点的 id
   * @param id - 被查询的节点的 id
   */
  isAncestorNodeOfId(ancestorId: IIdentifier, id: IIdentifier): boolean;
}

export type ICanvasModelLike = IModelBase<IDocumentModel>

export interface ICanvasModel extends ICanvasModelLike {
  replaceModel(newModel: IDocumentModel): void;
}

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

export const proxyHandler: ProxyHandler<ReturnType<typeof getNodeStyle>> = {
  get(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration | 'toJSON'): any {
    if (!isString(p)) NOTIMPLEMENTED();
    if (p === 'toJSON') {
      return () => {
        return target.toJSON();
      };
    }
    return target.get(p);
  },
  set(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration, value: ValueOf<Required<IStyleDeclaration>>): boolean {
    if (!isString(p)) NOTIMPLEMENTED();
    target.set(p, value);
    return true;
  },
  has(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): boolean {
    if (!isString(p)) NOTIMPLEMENTED();
    return target.has(p);
  },
  deleteProperty(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): boolean {
    if (!isString(p)) NOTIMPLEMENTED();
    target.delete(p);
    return true;
  },
  ownKeys(target: ReturnType<typeof getNodeStyle>): ArrayLike<keyof IStyleDeclaration> {
    return Array.from(target.keys()) as unknown as ArrayLike<keyof IStyleDeclaration>;
  }
};

class NodeProxy {
  // 通过 new 创建的，即这是 class instance
  readonly _newOnlyBrand: undefined;
  readonly id: IIdentifier;
  constructor(
    public y: YNode,
    protected model: ICanvasModelLike,
  ) {
    this.id = getNodeId(y);
  }
  isRoot(): this is RootNodeModelProxy {
    return false;
  }
  isBlock(): this is BlockNodeModelProxy {
    return false;
  }
  isText(): this is TextNodeModelProxy {
    return false;
  }
}

class ChildNodeProxy extends NodeProxy {
  get from(): IIdentifier {
    return getNodeFrom(this.y);
  }
  set from(val) {
    this.y.set('from', val);
  }
  get order(): string {
    return getNodeOrder(this.y);
  }
  set order(val) {
    this.y.set('order', val);
  }
}

export class RootNodeModelProxy extends ChildNodeProxy implements IRootNodeModel {
  type: EnumAndLiteral<NodeType.Root> = NodeType.Root;
  constructor(
    y: YNode,
    model: ICanvasModelLike,
  ) {
    super(y, model);
    const type = getNodeType(y);
    DCHECK(type === NodeType.Root);
  }
}

export class BlockNodeModelProxy extends ChildNodeProxy implements IBlockNodeModel {
  readonly style: IBlockStyleDeclaration;
  type: EnumAndLiteral<NodeType.Block> = NodeType.Block;
  constructor(
    y: YNode,
    model: ICanvasModelLike,
  ) {
    super(y, model);
    const type = getNodeType(y);
    DCHECK(type === NodeType.Block);
    this.style = new Proxy(getNodeStyle(y), proxyHandler) as unknown as IBlockStyleDeclaration & { toJSON(): IInlineStyleDeclaration };
  }
  isBlock(): this is BlockNodeModelProxy {
    return true;
  }
  // 给编辑器用的
  readonly _blockBrand: undefined;
  get children() {
    return this.model.getChildrenNodesOfId(this.id);
  }
  removeChildAt(idx: number): void {
    const children = this.children;
    const toDelete = children[idx];
    if (!toDelete) NOTREACHED();
    this.model.removeNode({ ref: toDelete.id, direction: DirectionType.self });
  }
  insertChildAt(idx: number, child: DescendantModelProxy): void {
    if (isPlainObject(child)) {
      const ref = this.children[idx];
      let init: INodeInit = Object.create(null);
      init.style = child.style ? { ...child.style } : Object.create(null);
      const content = Reflect.get(child, 'content');
      if (isNil(content)) {
        init.type = NodeType.Block;
      } else {
        init.type = NodeType.Text;
        (init as ITextNodeInit).content = content;
      }
      let ret: DescendantModelProxy;
      if (ref) {
        ret = this.model.addNode({ ref: ref.id, direction: DirectionType.forward }, init);
      } else {
        DCHECK(idx === this.children.length);
        ret = this.model.addNode({ ref: this.id, direction: DirectionType.inward }, init);
      }
      const children = Reflect.get(child, 'children');
      if (Array.isArray(children)) {
        DCHECK(isBlockNodeModelProxy(ret));
        ret.setChildren(...children);
      }
    } else {
      NOTIMPLEMENTED();
    }
  }
  appendChildren(...toAdd: DescendantModelProxy[]): void {
    let left = tail(this.children)?.order || '0';
    toAdd.forEach((child, i) => {
      child.from = this.id;
      left = devideBy2(plus(left, '1'));
      child.order = left;
    });
  }
  setChildren(...children: DescendantModelProxy[]): void {
    const prevChildren = this.children.slice();
    const detached = new Set<DescendantModelProxy>();
    let left = '0';
    children.forEach((child, i) => {
      child.from = this.id;
      left = devideBy2(plus(left, '1'));
      child.order = left;
      const prev = prevChildren.findIndex(i => i.id === child.id);
      if (prev !== -1) {
        prevChildren.splice(prev, 1);
      }
    });
    prevChildren.forEach(c => {
      c.from = 'undefined';
      detached.add(c);
    });
    setTimeout(() => {
      detached.forEach(c => {
        if (!c.from) console.log('detached', c);
      });
    });
  }
  insertAfter(child: DescendantModelProxy, ref: DescendantModelProxy): void {
    debugger;
    NOTIMPLEMENTED();
  }
}

export function isBlockNodeModelProxy(val: any): val is BlockNodeModelProxy {
  return val instanceof BlockNodeModelProxy;
}

export class TextNodeModelProxy extends ChildNodeProxy implements ITextNodeModel {
  readonly style: IBlockStyleDeclaration;
  type: EnumAndLiteral<NodeType.Text> = NodeType.Text;
  constructor(
    y: YNode,
    model: ICanvasModelLike,
  ) {
    super(y, model);
    const type = getNodeType(y);
    DCHECK(type === NodeType.Text);
    if (type !== NodeType.Text) {
      debugger;
    }
    this.style = new Proxy(getNodeStyle(y), proxyHandler) as unknown as IInlineStyleDeclaration & { toJSON(): IInlineStyleDeclaration };
  }
  get content(): string {
    return getNodeContent(this.y);
  }
  set content(val) {
    this.y.set('content', val);
  }
  // 给编辑器用的
  isText(): this is TextNodeModelProxy {
    return true;
  }
  setContent(val: string) {
    this.content = val;
  }
  getParent() {
    return this.model.getParentNodeOfId(this.id);
  }
  remove() {
    this.model.removeNode({ ref: this.id, direction: DirectionType.self });
  }
}

export function isTextNodeModelProxy(val: any): val is TextNodeModelProxy {
  return val instanceof TextNodeModelProxy;
}
export type NodeModelProxy = RootNodeModelProxy | BlockNodeModelProxy | TextNodeModelProxy
export type DescendantModelProxy = BlockNodeModelProxy | TextNodeModelProxy;

export interface BaseText {
  readonly content: string;
}

export type Descendant = { readonly children: readonly Descendant[] } | BaseText
export type AncestorModelProxy = RootNodeModelProxy | BlockNodeModelProxy
export function toProxy<T extends NodeModelProxy>(y: YNode, model: ICanvasModelLike): T {
  const type = getNodeType(y);
  if (type === NodeType.Root) {
    return new RootNodeModelProxy(y, model) as unknown as T;
  }
  if (type === NodeType.Block) {
    return new BlockNodeModelProxy(y, model) as unknown as T;
  }
  if (type === NodeType.Text) {
    return new TextNodeModelProxy(y, model) as unknown as T;
  }
  NOTIMPLEMENTED();
}
export function toOptionalProxy<T extends NodeModelProxy>(y: Optional<YNode>, model: ICanvasModelLike): Optional<T> {
  if (!y) return undefined;
  return toProxy<T>(y, model);
}
