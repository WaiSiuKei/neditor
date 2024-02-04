import { IDisposable } from '../../../base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../../base/common/notreached';
import { Optional } from '../../../base/common/typescript';
import { URI } from '../../../base/common/uri';
import { ScopedIdentifier } from '../../../canvas/canvasCommon/scope';
import { IResourceUndoRedoElement, UndoRedoElementType } from '../../undoRedo/common/undoRedo';
import { IDocumentModel } from './model';
import { Patch } from './reactivity/patch';

function uriGetComparisonKey(resource: URI): string {
  return resource.toString();
}

export class SingleModelEditStackData {
  public static create(model: IDocumentModel,
                       beforeCursorState: Optional<ScopedIdentifier[]>): SingleModelEditStackData {
    const alternativeVersionId = model.getAlternativeVersionId();
    return new SingleModelEditStackData(alternativeVersionId, alternativeVersionId, beforeCursorState, beforeCursorState, []);
  }

  constructor(public readonly beforeVersionId: number,
              public afterVersionId: number,
              public readonly beforeCursorState: Optional<ScopedIdentifier[]>,
              public afterCursorState: Optional<ScopedIdentifier[]>,
              public changes: Patch[]) {}

  public append(textChanges: Patch[],
                afterVersionId: number,
                afterCursorState: Optional<ScopedIdentifier[]>): void {
    if (textChanges.length > 0) {
      this.changes.push(...textChanges);
    }
    this.afterVersionId = afterVersionId;
    this.afterCursorState = afterCursorState;
  }
}

export class SingleModelEditStackElement implements IResourceUndoRedoElement {
  public model: IDocumentModel | URI;
  private _data: SingleModelEditStackData;

  public get type(): UndoRedoElementType.Resource {
    return UndoRedoElementType.Resource;
  }

  public get resource(): URI {
    if (URI.isUri(this.model)) {
      return this.model;
    }
    return this.model.uri;
  }

  constructor(public label: string,
              model: IDocumentModel,
              beforeCursorState: Optional<ScopedIdentifier[]>) {
    this.model = model;
    this._data = SingleModelEditStackData.create(model, beforeCursorState);
  }

  public toString(): string {
    const data = this._data;
    return data.changes.map(change => change.toString()).join(', ');
  }

  public append(
    changes: Patch[],
    afterVersionId: number,
    afterCursorState: Optional<ScopedIdentifier[]>): void {
    if (this._data instanceof SingleModelEditStackData) {
      this._data.append(changes, afterVersionId, afterCursorState);
    }
  }

  public undo(): void {
    if (URI.isUri(this.model)) {
      // don't have a model
      throw new Error(`Invalid SingleModelEditStackElement`);
    }
    NOTIMPLEMENTED();
    // const data = this._data;
    // this.model._applyUndo(data.changes, data.beforeVersionId, data.beforeCursorState ?? undefined);
  }

  public redo(): void {
    if (URI.isUri(this.model)) {
      // don't have a model
      throw new Error(`Invalid SingleModelEditStackElement`);
    }
    NOTIMPLEMENTED();
    // const data = this._data;
    // this.model._applyRedo(data.changes, data.afterVersionId, data.afterCursorState ?? undefined);
  }
}
