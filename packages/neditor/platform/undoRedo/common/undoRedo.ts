import { URI } from "../../../base/common/uri";
import { IDisposable } from "../../../base/common/lifecycle";
import { createDecorator } from "../../instantiation/common/instantiation";

export const IUndoRedoService = createDecorator<IUndoRedoService>('undoRedoService');

export interface IUndoRedoService {
  readonly _serviceBrand: undefined;
  canUndo(resource: URI | UndoRedoSource): boolean;
  undo(resource: URI | UndoRedoSource): Promise<void> | void;

  canRedo(resource: URI | UndoRedoSource): boolean;
  redo(resource: URI | UndoRedoSource): Promise<void> | void;
}

export class UndoRedoSource {
  private static _ID = 0;

  static isInstance(other: any): other is UndoRedoSource {
    return Reflect.get(other, '__classBland__') === 'UndoRedoSource';
  }

  public readonly __classBland__ = 'UndoRedoSource';
  public readonly id: number;
  private order: number;

  constructor() {
    this.id = UndoRedoSource._ID++;
    this.order = 1;
  }

  public nextOrder(): number {
    if (this.id === 0) {
      return 0;
    }
    return this.order++;
  }

  public static None = new UndoRedoSource();
}
