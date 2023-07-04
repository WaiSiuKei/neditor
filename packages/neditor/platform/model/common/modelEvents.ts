/**
 * An event describing a change in the text of a model.
 */
import { ScopedIdentifier } from "../../../canvas/canvasCommon/scope";
import { Optional } from "../../../base/common/typescript";

export interface IModelContentChangedEvent {
  // readonly changes: IModelContentChange[];
  /**
   * The new version id the model has transitioned to.
   */
  readonly versionId: number;
  /**
   * Flag that indicates that this event was generated while undoing.
   */
  readonly isUndoing?: boolean;
  /**
   * Flag that indicates that this event was generated while redoing.
   */
  readonly isRedoing?: boolean;
  readonly resultingSelection?: ScopedIdentifier[];
}

export class ModelContentChangedEvent implements IModelContentChangedEvent {
  // public readonly changes: IModelContentChange[];
  /**
   * The new version id the model has transitioned to.
   */
  public readonly versionId: number;
  /**
   * Flag that indicates that this event was generated while undoing.
   */
  public readonly isUndoing: boolean;
  /**
   * Flag that indicates that this event was generated while redoing.
   */
  public readonly isRedoing: boolean;

  public resultingSelection: Optional<ScopedIdentifier[]>;

  constructor(versionId: number, isUndoing: boolean, isRedoing: boolean) {
    this.versionId = versionId;
    this.isUndoing = isUndoing;
    this.isRedoing = isRedoing;
  }

  public merge(b: ModelContentChangedEvent): ModelContentChangedEvent {
    const versionId = b.versionId;
    const isUndoing = this.isUndoing || b.isUndoing;
    const isRedoing = this.isRedoing || b.isRedoing;
    return new ModelContentChangedEvent(versionId, isUndoing, isRedoing);
  }
}

