import { Disposable, IDisposable, toDisposable } from "../../../base/common/lifecycle";
import { ICanvasModel, IModelChangeParticipant } from "./model";
import { IModelContentChangedEvent } from "./modelEvents";
import { NOTIMPLEMENTED } from "../../../base/common/notreached";
import { insert } from "../../../base/common/array";

export class ModelChangeParticipant extends Disposable {
  private readonly saveParticipants: IModelChangeParticipant[] = [];

  constructor() {
    super();
  }

  addSaveParticipant(participant: IModelChangeParticipant): IDisposable {
    const remove = insert(this.saveParticipants, participant);

    return toDisposable(() => remove());
  }

  participate(model: ICanvasModel, changes: IModelContentChangedEvent) {
    for (const saveParticipant of this.saveParticipants) {
      try {
        saveParticipant.participate(model, changes);
      } catch (err) {
        NOTIMPLEMENTED();
      }
    }
  }

  dispose(): void {
    this.saveParticipants.splice(0, this.saveParticipants.length);
  }
}
