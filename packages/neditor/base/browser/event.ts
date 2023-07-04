import { Emitter, Event as BaseEvent } from "../common/event";
import { IDisposable } from "../common/lifecycle";
import { GestureEvent } from "./touch";

export function clientToLocal(e: MouseEvent, ele: Element): { x: number, y: number } {
  const rect = ele.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}


export type EventHandler = HTMLElement | HTMLDocument | Window;

export interface IDomEvent {
  <K extends keyof HTMLElementEventMap>(element: EventHandler, type: K, useCapture?: boolean): BaseEvent<HTMLElementEventMap[K]>;
  (element: EventHandler, type: string, useCapture?: boolean): BaseEvent<unknown>;
}

export interface DOMEventMap extends HTMLElementEventMap, DocumentEventMap, WindowEventMap {
  '-monaco-gesturetap': GestureEvent;
  '-monaco-gesturechange': GestureEvent;
  '-monaco-gesturestart': GestureEvent;
  '-monaco-gesturesend': GestureEvent;
  '-monaco-gesturecontextmenu': GestureEvent;
  'compositionstart': CompositionEvent;
  'compositionupdate': CompositionEvent;
  'compositionend': CompositionEvent;
}

export class DomEmitter<K extends keyof DOMEventMap> implements IDisposable {

  private emitter: Emitter<DOMEventMap[K]>;

  get event(): BaseEvent<DOMEventMap[K]> {
    return this.emitter.event;
  }

  constructor(element: Window & typeof globalThis, type: WindowEventMap, useCapture?: boolean);
  constructor(element: Document, type: DocumentEventMap, useCapture?: boolean);
  constructor(element: EventHandler, type: K, useCapture?: boolean);
  constructor(element: EventHandler, type: K, useCapture?: boolean) {
    const fn = (e: Event) => this.emitter.fire(e as DOMEventMap[K]);
    this.emitter = new Emitter({
      onWillAddFirstListener: () => element.addEventListener(type, fn, useCapture),
      onDidRemoveLastListener: () => element.removeEventListener(type, fn, useCapture)
    });
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
