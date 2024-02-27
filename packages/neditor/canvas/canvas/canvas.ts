import { ServicesAccessor } from '@neditor/core/platform/instantiation/common/instantiation';
import { ICanvasView } from '../view/view';
import { IEventFilter } from '@neditor/core/platform/input/browser/event';
import { IDocumentModel, IOperationCallback } from '../../platform/model/common/model';
import { Event } from '../../base/common/event';
import { Optional } from '../../base/common/typescript';
import { IDocument } from '../../common/record';
import { URI } from '../../base/common/uri';
import { IModelContentChangedEvent } from '../../platform/model/common/modelEvents';

export interface ICanvasState {
  zoom: number;
}

export interface ICanvas extends ICanvasState {
  id: string;
  readonly model: IDocumentModel;
  readonly view: ICanvasView;

  onDidChangeModel: Event<IModelChangedEvent>;
  onDidChangeModelContent: Event<IModelContentChangedEvent>;

  setModel(model: Optional<IDocumentModel>): void;
  updateModel(val: IDocument): void;

  installEventFilter(filter: IEventFilter): void;

  invokeWithinContext<T>(fn: (accessor: ServicesAccessor) => T): T;

  focus(): void;
  isFocused(): boolean;

  transform<T>(cb: IOperationCallback<T>): T;

  canUndo(): boolean;
  undo(): void;
  canRedo(): boolean;
  redo(): void;

  // getElementAtPosition(
  //   x: number,
  //   y: number,
  // ): CanvasElement | null;

  reflow(): void;
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
