import { IDisposable } from '../../../base/common/lifecycle';
import { URI } from '../../../base/common/uri';
import { createDecorator } from '../../instantiation/common/instantiation';

export const IUndoRedoService = createDecorator<IUndoRedoService>('undoRedoService');

export interface IUndoRedoService {
  readonly _serviceBrand: undefined;
  pushElement(element: IUndoRedoElement): void;
  removeElements(resource: URI): void;
  canUndo(resource: URI): boolean;
  undo(resource: URI): Promise<void> | void;

  canRedo(resource: URI): boolean;
  redo(resource: URI): Promise<void> | void;
}

export const enum UndoRedoElementType {
  Resource,
  Workspace,
}

export interface IResourceUndoRedoElement {
  readonly type: UndoRedoElementType.Resource;
  /**
   * The resource impacted by this element.
   */
  readonly resource: URI;
  /**
   * A user presentable label. May be localized.
   */
  readonly label: string;
  /**
   * A code describing the operation. Will not be localized.
   */
  // readonly code: string;
  /**
   * Show a message to the user confirming when trying to undo this element
   */
  readonly confirmBeforeUndo?: boolean;
  undo(): Promise<void> | void;
  redo(): Promise<void> | void;
}

export interface IWorkspaceUndoRedoElement {
  readonly type: UndoRedoElementType.Workspace;
  /**
   * The resources impacted by this element.
   */
  readonly resources: readonly URI[];
  /**
   * A user presentable label. May be localized.
   */
  readonly label: string;
  /**
   * A code describing the operation. Will not be localized.
   */
  // readonly code: string;
  /**
   * Show a message to the user confirming when trying to undo this element
   */
  readonly confirmBeforeUndo?: boolean;
  undo(): Promise<void> | void;
  redo(): Promise<void> | void;

  /**
   * If implemented, indicates that this undo/redo element can be split into multiple per resource elements.
   */
  split?(): IResourceUndoRedoElement[];

  /**
   * If implemented, will be invoked before calling `undo()` or `redo()`.
   * This is a good place to prepare everything such that the calls to `undo()` or `redo()` are synchronous.
   * If a disposable is returned, it will be invoked to clean things up.
   */
  prepareUndoRedo?(): Promise<IDisposable> | IDisposable | void;
}

export type IUndoRedoElement = IResourceUndoRedoElement | IWorkspaceUndoRedoElement;

export interface IPastFutureElements {
  past: IUndoRedoElement[];
  future: IUndoRedoElement[];
}

export class ResourceEditStackSnapshot {
  constructor(public readonly resource: URI,
              public readonly elements: number[]) {}
}
