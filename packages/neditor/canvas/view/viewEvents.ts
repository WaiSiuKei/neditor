import { onUnexpectedError } from '../../base/common/errors';
import { Disposable, IDisposable, toDisposable } from '../../base/common/lifecycle';

export const enum ViewEventType {
  // ViewConfigurationChanged = 1,
  // ViewContentSizeChanged = 2,
  ViewCursorStateChanged = 3,
  // ViewDecorationsChanged = 4,
  // ViewFlushed = 5,
  // ViewFocusChanged = 6,
  // ViewLanguageConfigurationChanged = 7,
  // ViewLineMappingChanged = 8,
  // ViewLinesChanged = 9,
  // ViewLinesDeleted = 10,
  // ViewLinesInserted = 11,
  // ViewRevealRangeRequest = 12,
  // ViewScrollChanged = 13,
  // ViewThemeChanged = 14,
  // ViewTokensChanged = 15,
  // ViewTokensColorsChanged = 16,
  // ViewZonesChanged = 17,
}

export class ViewCursorStateChangedEvent {

  public readonly type = ViewEventType.ViewCursorStateChanged;

  public readonly selections: Selection[];
  public readonly modelSelections: Selection[];

  constructor(selections: Selection[], modelSelections: Selection[]) {
    this.selections = selections;
    this.modelSelections = modelSelections;
  }
}

export type ViewEvent = (
  // ViewConfigurationChangedEvent
  // | ViewContentSizeChangedEvent
  ViewCursorStateChangedEvent
  // | ViewDecorationsChangedEvent
  // | ViewFlushedEvent
  // | ViewFocusChangedEvent
  // | ViewLanguageConfigurationEvent
  // | ViewLineMappingChangedEvent
  // | ViewLinesChangedEvent
  // | ViewLinesDeletedEvent
  // | ViewLinesInsertedEvent
  // | ViewRevealRangeRequestEvent
  // | ViewScrollChangedEvent
  // | ViewThemeChangedEvent
  // | ViewTokensChangedEvent
  // | ViewTokensColorsChangedEvent
  // | ViewZonesChangedEvent
  );

export interface IViewEventListener {
  (events: ViewEvent[]): void;
}

export class ViewEventEmitter extends Disposable {
  private _listeners: IViewEventListener[];
  private _collector: ViewEventsCollector | null;
  private _collectorCnt: number;

  constructor() {
    super();
    this._listeners = [];
    this._collector = null;
    this._collectorCnt = 0;
  }

  public dispose(): void {
    this._listeners = [];
    super.dispose();
  }

  protected _beginEmit(): ViewEventsCollector {
    this._collectorCnt++;
    if (this._collectorCnt === 1) {
      this._collector = new ViewEventsCollector();
    }
    return this._collector!;
  }

  protected _endEmit(): void {
    this._collectorCnt--;
    if (this._collectorCnt === 0) {
      const events = this._collector!.finalize();
      this._collector = null;
      if (events.length > 0) {
        this._emit(events);
      }
    }
  }

  private _emit(events: ViewEvent[]): void {
    const listeners = this._listeners.slice(0);
    for (let i = 0, len = listeners.length; i < len; i++) {
      safeInvokeListener(listeners[i], events);
    }
  }

  public addEventListener(listener: (events: ViewEvent[]) => void): IDisposable {
    this._listeners.push(listener);
    return toDisposable(() => {
      let listeners = this._listeners;
      for (let i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    });
  }
}

export class ViewEventsCollector {

  private _events: ViewEvent[];
  private _eventsLen = 0;

  constructor() {
    this._events = [];
    this._eventsLen = 0;
  }

  public emit(event: ViewEvent) {
    this._events[this._eventsLen++] = event;
  }

  public finalize(): ViewEvent[] {
    let result = this._events;
    this._events = [];
    return result;
  }

}

function safeInvokeListener(listener: IViewEventListener, events: ViewEvent[]): void {
  try {
    listener(events);
  } catch (e) {
    onUnexpectedError(e);
  }
}
