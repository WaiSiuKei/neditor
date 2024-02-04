import { Emitter, Event } from '../../../base/common/event';
import { Disposable, IDisposable } from '../../../base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../../base/common/notreached';
import { reactive } from '../../../base/common/reactivity';
import { Optional } from '../../../base/common/typescript';
import { URI } from '../../../base/common/uri';
import { generateUuid } from '../../../base/common/uuid';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { IDescendantNode, IModelNode } from '../../../common/node';
import { IDocument } from '../../../common/record';
import { IIdentifier } from '../../../common/record/common';
import { RecordType } from '../../../common/record/types/base';
import { IDocumentModel, IModelOperationContext, IModelService, INodeInit } from './model';
import { IModelContentChangedEvent, ModelContentChangedEvent } from './modelEvents';
import { BlockNode, TextNode } from './modelNodeImpl';
import { invert, Patch, redoPatches } from './reactivity/patch';

export class BaseDocumentModel<T extends IDocument> extends Disposable implements IDocumentModel<T> {
  static MODEL_ID = 0;
  id = BaseDocumentModel.MODEL_ID++;

  public readonly document: T;
  private nodes = new Map<string, IModelNode>();
  protected ctx: IModelOperationContext;
  private _isDisposed = false;
  private _isDisposing = false;
  private _versionId = 1;
  /**
   * Unlike, versionId, this can go down (via undo) or go to previous values (via redo)
   */
  private _alternativeVersionId = 1;
  private readonly _associatedResource: URI;
  private _isUndoing = false;
  private _isRedoing = false;

  protected readonly _eventEmitter: DidChangeContentEmitter = this._register(new DidChangeContentEmitter());

  private _onWillDispose: Emitter<void> = this._register(new Emitter<void>());

  public onDidChangeContent(listener: (e: IModelContentChangedEvent) => void): IDisposable {
    return this._eventEmitter.slowEvent((e: ModelContentChangedEvent) => listener(e));
  }

  constructor(
    rawModel: T,
    associatedResource: Optional<URI>,
    private modelService: IModelService
  ) {
    super();
    this.ctx = modelService;
    this.document = this._processInput(rawModel);
    if (typeof associatedResource === 'undefined' || associatedResource === null) {
      this._associatedResource = URI.parse(`inmemory://model/${this.id}.json`);
    } else {
      this._associatedResource = associatedResource;
    }

    Reflect.set(window, 'model', this);
  }

  dispose() {
    this._isDisposing = true;
    this._onWillDispose.fire();
    this._isDisposed = true;
    super.dispose();
    this._isDisposing = false;
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

  beforeMutation() {
    this._eventEmitter.beginDeferredEmit();
  }

  afterMutation(patches: Patch[]) {
    if (patches.length) {
      this._increaseVersionId();
      const changeEvt = new ModelContentChangedEvent(this.getVersionId(), this._isUndoing, this._isRedoing);
      this._emitContentChangedEvent(changeEvt);
      this.modelService.runChangeParticipants(this, changeEvt);
    }
    this._eventEmitter.endDeferredEmit();
  }

  _applyUndo(changes: Patch[],
             resultingAlternativeVersionId: number,
             resultingSelection?: Optional<ScopedIdentifier[]>): void {
    const inverted = changes.reverse().map(p => invert(p));
    this._applyUndoRedoEdits(inverted, true, false, resultingAlternativeVersionId, resultingSelection);
  }

  _applyRedo(changes: Patch[],
             resultingAlternativeVersionId: number,
             resultingSelection?: Optional<ScopedIdentifier[]>): void {
    this._applyUndoRedoEdits(changes, false, true, resultingAlternativeVersionId, resultingSelection);
  }

  private _applyUndoRedoEdits(edits: Patch[],
                              isUndoing: boolean,
                              isRedoing: boolean,
                              resultingAlternativeVersionId: number,
                              resultingSelection?: Optional<ScopedIdentifier[]>): void {
    try {
      this._eventEmitter.beginDeferredEmit();
      this._isUndoing = isUndoing;
      this._isRedoing = isRedoing;
      this.applyEdits(edits);
      this._overwriteAlternativeVersionId(resultingAlternativeVersionId);
    } catch (e) {
      console.error(e);
      debugger;
    } finally {
      this._isUndoing = false;
      this._isRedoing = false;
      this._eventEmitter.endDeferredEmit(resultingSelection);
    }
  }

  public applyEdits(operations: Patch[]): void {
    try {
      this._eventEmitter.beginDeferredEmit();
      return this._doApplyEdits(operations);
    } catch (e) {
      console.error(e);
      debugger;
    } finally {
      this._eventEmitter.endDeferredEmit();
    }
  }

  private _doApplyEdits(operations: Patch[]): void {
    redoPatches(this.document, operations);
    this._emitContentChangedEvent(new ModelContentChangedEvent(this.getVersionId(), this._isUndoing, this._isRedoing));
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
    return NOTIMPLEMENTED();
  }

  protected _processInput(input: T): T {
    // @ts-ignore
    return reactive(input);
  }

  get uri(): URI {
    return this._associatedResource;
  }

  protected _updateContextGuard() {
    if (!this.ctx.isUpdating()) throw new Error('method should not be called outside transform()');
  }

  createNode(init: INodeInit): IDescendantNode {
    this._updateContextGuard();
    switch (init.type) {
      case RecordType.Block:
        return new BlockNode({
          id: generateUuid(),
          from: '',
          order: '',
          ...init
        }, this);
      case RecordType.Text:
        return new TextNode({
          id: generateUuid(),
          from: '',
          order: '',
          ...init
        }, this);
    }
    return NOTIMPLEMENTED();
  }

  getNodeById(id: IIdentifier): Optional<IModelNode> {
    return this.nodes.get(id);
  }

  addNode(n: IDescendantNode) {
    this._updateContextGuard();
    this.document.nodes[n.id] = n;
    this.nodes.set(n.id, n);
  }
  removeNode(n: IDescendantNode) {
    this._updateContextGuard();
    delete this.document.nodes[n.id];
    this.nodes.delete(n.id);
  }
}

export class DocumentModel extends BaseDocumentModel<IDocument> {
  constructor(rawModel: IDocument,
              associatedResource: Optional<URI>,
              @IModelService modelService: IModelService) {
    super(rawModel, associatedResource, modelService);
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
