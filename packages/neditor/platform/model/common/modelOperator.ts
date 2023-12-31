import * as Y from 'yjs';
import { DCHECK } from '../../../base/check';
import { cmp } from '../../../base/common/bignumber';
import { Emitter, Event } from '../../../base/common/event';
import { Disposable, IDisposable, toDisposable } from '../../../base/common/lifecycle';
import { NOTREACHED } from '../../../base/common/notreached';
import { deepClone, keys } from '../../../base/common/objects';
import { isObject, isString } from '../../../base/common/type';
import { Optional } from '../../../base/common/typescript';
import { URI } from '../../../base/common/uri';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { IIdentifier } from '../../../common/common';
import { getModelNodes, IDocumentModel, IYDocumentModel, IYNodeModels } from '../../../common/model';
import { getNodeContent, getNodeFrom, getNodeId, getNodeOrder, getNodeType, NodeType, YNode, YNodeValue } from '../../../common/node';
import { DirectionType, ILocation } from './location';
import { AncestorModelProxy, DescendantModelProxy, IModelBase, IModelOperationContext, IModelService, INodeInit, NodeModelProxy, toOptionalProxy, toProxy } from './model';
import { IModelContentChangedEvent, ModelContentChangedEvent } from './modelEvents';
import { insertNodeOperation, removeNodeOperation, reorderNodeOperation, reparentNodeOperation, } from './operation/nodes';

export class ModelOperator<T extends IDocumentModel> extends Disposable implements IModelBase<T> {
  static MODEL_ID = 0;
  id = ModelOperator.MODEL_ID++;

  protected _yModel!: IYDocumentModel;
  protected _undoManager!: Y.UndoManager;

  protected ctx: IModelOperationContext;
  private _isDisposed = false;
  private _isDisposing = false;
  private _versionId = 1;
  /**
   * Unlike, versionId, this can go down (via undo) or go to previous values (via redo)
   */
  private _alternativeVersionId = 1;

  private _isUndoing: boolean;
  private _isRedoing: boolean;

  private readonly _associatedResource: URI;
  protected readonly _eventEmitter: DidChangeContentEmitter = this._register(new DidChangeContentEmitter());

  private _onWillDispose: Emitter<void> = this._register(new Emitter<void>());

  public onDidChangeContent(listener: (e: IModelContentChangedEvent) => void): IDisposable {
    return this._eventEmitter.slowEvent((e: ModelContentChangedEvent) => listener(e));
  }

  constructor(rawModel: T, protected doc: Y.Doc, associatedResource: Optional<URI>, private modelService: IModelService) {
    super();
    this.ctx = modelService;
    this._isUndoing = false;
    this._isRedoing = false;
    if (typeof associatedResource === 'undefined' || associatedResource === null) {
      this._associatedResource = URI.parse(`inmemory://model/${this.id}.json`);
    } else {
      this._associatedResource = associatedResource;
    }
    this._yModel = this._processInput(rawModel);
    this._undoManager = new Y.UndoManager(this._yModel);
    this._registerUndoRedoListeners();

    Reflect.set(window, 'model', this);
  }

  dispose() {
    this._isDisposing = true;
    this._onWillDispose.fire();
    this._isDisposed = true;
    super.dispose();
    this._isDisposing = false;
  }

  _registerUndoRedoListeners() {
    const keyVersion = 'version';
    const keyVersionBefore = 'versionBefore';
    const onStackItemAdded = (event: {
      stackItem: { meta: Map<any, any> },
      type: 'undo' | 'redo',
      origin: Y.UndoManager | null
    }) => {
      const { meta } = event.stackItem;
      if (event.type === 'redo') {
        meta.set(keyVersion, this._versionId);
        meta.set(keyVersionBefore, this._versionId - 1);
      }
      if (event.type === 'undo' && event.origin !== this._undoManager) {
        const versionBefore = this.getVersionId();
        this._increaseVersionId();
        meta.set(keyVersion, this.getVersionId());
        meta.set(keyVersionBefore, versionBefore);
        this._emitContentChangedEvent(new ModelContentChangedEvent(
          this._alternativeVersionId,
          false,
          false,
        ));
      }
    };
    const onStackItemPoped = (event: { stackItem: { meta: Map<any, any>, }, type: 'undo' | 'redo' }) => {
      const { meta } = event.stackItem;
      let versionBefore = meta.get(keyVersionBefore);
      let versionAfter = meta.get(keyVersion);
      const isUndoing = event.type === 'undo';
      const isRedoing = event.type === 'redo';
      this._overwriteAlternativeVersionId(isUndoing ? versionBefore : versionAfter);
      this._emitContentChangedEvent(new ModelContentChangedEvent(
        this._alternativeVersionId,
        isUndoing,
        isRedoing,
      ));
    };
    this._undoManager.on('stack-item-added', onStackItemAdded);
    this._undoManager.on('stack-item-popped', onStackItemPoped);
    this._register(toDisposable(() => this._undoManager.off('stack-item-added', onStackItemAdded)));
    this._register(toDisposable(() => this._undoManager.off('stack-item-popped', onStackItemPoped)));
  }

  get onWillDispose(): Event<void> {
    return this._onWillDispose.event;
  }

  getAlternativeVersionId(): number {
    this._assertNotDisposed();
    return this._alternativeVersionId;
  }

  getVersionId(): number {
    this._assertNotDisposed();
    return this._versionId;
  }

  private _assertNotDisposed(): void {
    if (this._isDisposed) {
      throw new Error('Model is disposed!');
    }
  }

  private _increaseVersionId(): void {
    this._versionId = this._versionId + 1;
    this._alternativeVersionId = this._versionId;
  }

  public _overwriteAlternativeVersionId(newAlternativeVersionId: number): void {
    this._alternativeVersionId = newAlternativeVersionId;
  }

  private _emitContentChangedEvent(change: ModelContentChangedEvent): void {
    if (this._isDisposing) {
      // Do not confuse listeners by emitting any event after disposing
      return;
    }
    this._eventEmitter.fire(change);
  }

  get undoManager() {
    return this._undoManager;
  }

  undo() {
    this.undoManager.undo();
  }
  redo() {
    this.undoManager.redo();
  }
  canUndo(): boolean {
    return this.undoManager.canUndo();
  }
  canRedo(): boolean {
    return this.undoManager.canRedo();
  }

  get yModel() {
    return this._yModel;
  }

  protected _processInput(input: T): IYDocumentModel {
    const model = this.doc.getMap<IYNodeModels>(this._associatedResource.toString());
    const nodes = new Y.Map<YNode>();
    model.set('nodes', nodes);
    keys(input.nodes).forEach(id => {
      const nodeModel = input.nodes[id];
      const yNodeModel = new Y.Map<YNodeValue>();
      nodes.set(id, yNodeModel);
      keys(nodeModel).forEach(nodeAttrName => {
        const val = nodeModel[nodeAttrName];
        if (isObject(val)) {
          DCHECK(nodeAttrName === 'style');
          const yV = new Y.Map<string>();
          keys(val).forEach(k => {
            yV.set(k, val[k]);
          });
          yNodeModel.set(nodeAttrName, yV);
        } else if (isString(val)) {
          yNodeModel.set(nodeAttrName, val);
        } else {
          NOTREACHED();
        }
      });
    });

    return model;
  }

  getValue(): T {
    return this._yModel.toJSON() as T;
  }

  get uri(): URI {
    return this._associatedResource;
  }

  protected _updateContextGuard() {
    if (!this.ctx.isUpdating()) throw new Error('method should not be called outside transform()');
  }

  _internal_addNode(at: ILocation, init: INodeInit): YNode {
    this._updateContextGuard();
    return insertNodeOperation(deepClone(at), init)(this);
  }

  addNode(at: ILocation, init: INodeInit): DescendantModelProxy {
    return toProxy(this._internal_addNode(at, init), this);
  }

  removeNode(at: ILocation) {
    this._updateContextGuard();
    removeNodeOperation(at)(this);
  }

  removeEmptyTextNodes() {
    this._updateContextGuard();
    const nodes = getModelNodes(this._yModel);
    for (let node of nodes.values()) {
      if (getNodeType(node) === NodeType.Text && !getNodeContent(node)) {
        this.removeNode({ ref: getNodeId(node), direction: DirectionType.self });
      }
    }
  }

  removeNodes(ids: IIdentifier[]) {
    this._updateContextGuard();
    for (const id of ids) {
      removeNodeOperation({
        ref: id,
        direction: DirectionType.self,
      })(this);
    }
  }

  reparentNode(id: IIdentifier, newParent: IIdentifier, referenceNodeId: Optional<IIdentifier> = undefined): void {
    this._updateContextGuard();
    reparentNodeOperation(id, newParent, referenceNodeId)(this);
  }

  reorderNode(id: IIdentifier, beforeSiblingNodeId: Optional<IIdentifier> = undefined): void {
    this._updateContextGuard();
    reorderNodeOperation(id, beforeSiblingNodeId)(this);
  }

  _internal_getNodeById(id: IIdentifier) {
    return getModelNodes(this._yModel).get(id);
  }

  getNodeById(id: IIdentifier): Optional<NodeModelProxy> {
    return toOptionalProxy(this._internal_getNodeById(id), this);
  }

  _internal_getParentNodeOfId(id: IIdentifier) {
    const node = this._internal_getNodeById(id)!;
    if (!node) return undefined;
    const from = getNodeFrom(node);
    return from ? this._internal_getNodeById(from) : undefined;
  }
  getParentNodeOfId(id: IIdentifier): Optional<AncestorModelProxy> {
    return toOptionalProxy(this._internal_getParentNodeOfId(id), this);
  }
  _internal_getPreviousSiblingNodeOfId(id: string) {
    const parent = this._internal_getParentNodeOfId(id);
    if (!parent) {
      throw new Error('404');
    }
    const children = this._internal_getChildrenNodesOfId(getNodeId(parent));
    // 少于一个元素的情况下 肯定没有前后节点
    if (children.length <= 1) {
      return undefined;
    }
    const index = children.findIndex(cv => cv.get('id') as string === id);
    const preNode = children[index - 1] || null;
    return preNode;
  }
  _internal_getNextSiblingNodeOfId(id: string) {
    const parent = this._internal_getParentNodeOfId(id);
    if (!parent) {
      throw new Error('404');
    }
    const children = this._internal_getChildrenNodesOfId(getNodeId(parent));
    // 少于一个元素的情况下 肯定没有前后节点
    if (children.length <= 1) {
      return undefined;
    }
    const index = children.findIndex(cv => getNodeId(cv) === id);
    return children[index + 1];
  }
  _internal_getAncestorNodesOfId(id: IIdentifier): YNode[] {
    const ret: YNode[] = [];
    let p = this._internal_getParentNodeOfId(id);
    while (p) {
      ret.unshift(p);
      p = this._internal_getParentNodeOfId(getNodeId(p));
    }
    return ret;
  }
  isAncestorNodeOfId(ancestorId: IIdentifier, id: IIdentifier): boolean {
    const ancestors = this._internal_getAncestorNodesOfId(id);
    return ancestors.some(cv => getNodeId(cv) === ancestorId);
  }
  _internal_getChildrenNodesOfId(id: IIdentifier): YNode[] {
    const nodeArr = Array.from(this._yModel.get('nodes')!.values() as IterableIterator<YNode>);
    return nodeArr.filter(n => getNodeFrom(n) === id).sort((a, b) => cmp(getNodeOrder(a), getNodeOrder(b)));
  }
  getAncestorNodesOfId(id: IIdentifier): AncestorModelProxy[] {
    return this._internal_getAncestorNodesOfId(id).map(n => toProxy(n, this));
  }
  getChildrenNodesOfId(id: IIdentifier): DescendantModelProxy[] {
    return this._internal_getChildrenNodesOfId(id).map(n => toProxy(n, this));
  }
  getNextSiblingNodeOfId(id: IIdentifier): Optional<DescendantModelProxy> {
    return toOptionalProxy(this._internal_getNextSiblingNodeOfId(id), this);
  }
  getPreviousSiblingNodeOfId(id: IIdentifier): Optional<DescendantModelProxy> {
    return toOptionalProxy(this._internal_getPreviousSiblingNodeOfId(id), this);
  }
}

export class DidChangeContentEmitter extends Disposable {
  /**
   * Both `fastEvent` and `slowEvent` work the same way and contain the same events, but first we invoke `fastEvent` and then `slowEvent`.
   */
  private readonly _fastEmitter: Emitter<ModelContentChangedEvent> = this._register(new Emitter<ModelContentChangedEvent>());

  public readonly fastEvent: Event<ModelContentChangedEvent> = this._fastEmitter.event;
  private readonly _slowEmitter: Emitter<ModelContentChangedEvent> = this._register(new Emitter<ModelContentChangedEvent>());

  public readonly slowEvent: Event<ModelContentChangedEvent> = this._slowEmitter.event;

  private _deferredCnt: number;
  private _deferredEvent: ModelContentChangedEvent | null;

  constructor() {
    super();
    this._deferredCnt = 0;
    this._deferredEvent = null;
  }

  public hasListeners(): boolean {
    return this._fastEmitter.hasListeners() || this._slowEmitter.hasListeners();
  }

  public beginDeferredEmit(): void {
    this._deferredCnt++;
  }

  public endDeferredEmit(resultingSelection?: Optional<ScopedIdentifier[]>): void {
    this._deferredCnt--;
    if (this._deferredCnt === 0) {
      if (this._deferredEvent !== null) {
        this._deferredEvent.resultingSelection = resultingSelection;
        const e = this._deferredEvent;
        this._deferredEvent = null;
        this._fastEmitter.fire(e);
        this._slowEmitter.fire(e);
      }
    }
  }

  public fire(e: ModelContentChangedEvent): void {
    if (this._deferredCnt > 0) {
      if (this._deferredEvent) {
        this._deferredEvent = this._deferredEvent.merge(e);
      } else {
        this._deferredEvent = e;
      }
      return;
    }
    this._fastEmitter.fire(e);
    this._slowEmitter.fire(e);
  }
}
