import { ScopedIdentifier } from '../canvasCommon/scope';

export interface ISelectionChangedEvent {
  oldSelection: ScopedIdentifier[];
  newSelection: ScopedIdentifier[];
}
