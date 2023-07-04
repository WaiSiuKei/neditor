/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import {
  combinedDisposable,
  Disposable,
  DisposableStore,
  IDisposable,
  SafeDisposable,
  toDisposable,
} from './lifecycle';
import { LinkedList } from './linkedList';
import { once as onceFn } from '@neditor/core/base/common/functional';
import { IWaitUntil } from './async';
import { CancellationToken } from './cancellation';
import { onUnexpectedError } from './errors';
import { StopWatch } from './stopwatch';
import { MicrotaskDelay } from "./symbols";
import { IObservable, IObserver } from "./observableImpl/base";

// -----------------------------------------------------------------------------------------------------------------------
// Uncomment the next line to print warnings whenever an emitter with listeners is disposed. That is a sign of code smell.
// -----------------------------------------------------------------------------------------------------------------------
const _enableDisposeWithListenerWarning = false;
// _enableDisposeWithListenerWarning = Boolean("TRUE"); // causes a linter warning so that it cannot be pushed

// -----------------------------------------------------------------------------------------------------------------------
// Uncomment the next line to print warnings whenever a snapshotted event is used repeatedly without cleanup.
// See https://github.com/microsoft/vscode/issues/142851
// -----------------------------------------------------------------------------------------------------------------------
const _enableSnapshotPotentialLeakWarning = false;
// _enableSnapshotPotentialLeakWarning = Boolean("TRUE"); // causes a linter warning so that it cannot be pushed

class EventProfiling {
  private static _idPool = 0;

  private _name: string;
  private _stopWatch?: StopWatch;
  private _listenerCount = 0;
  private _invocationCount = 0;
  private _elapsedOverall = 0;

  constructor(name: string) {
    this._name = `${name}_${EventProfiling._idPool++}`;
  }

  start(listenerCount: number): void {
    this._stopWatch = new StopWatch(true);
    this._listenerCount = listenerCount;
  }

  stop(): void {
    if (this._stopWatch) {
      const elapsed = this._stopWatch.elapsed();
      this._elapsedOverall += elapsed;
      this._invocationCount += 1;

      console.info(
        `did FIRE ${this._name}: elapsed_ms: ${elapsed.toFixed(5)}, listener: ${
          this._listenerCount
        } (elapsed_overall: ${this._elapsedOverall.toFixed(2)}, invocations: ${
          this._invocationCount
        })`,
      );
      this._stopWatch = undefined;
    }
  }
}

let _globalLeakWarningThreshold = -1;
export function setGlobalLeakWarningThreshold(n: number): IDisposable {
  const oldValue = _globalLeakWarningThreshold;
  _globalLeakWarningThreshold = n;
  return {
    dispose() {
      _globalLeakWarningThreshold = oldValue;
    },
  };
}

/**
 * To an event a function with one or zero parameters
 * can be subscribed. The event is the subscriber function itself.
 */
export interface Event<T> {
  (
    listener: (e: T) => any,
    thisArgs?: any,
    disposables?: IDisposable[] | DisposableStore,
  ): IDisposable;
}

export namespace Event {
  export const None: Event<any> = () => Disposable.None;

  function _addLeakageTraceLogic(options: EmitterOptions) {
    if (_enableSnapshotPotentialLeakWarning) {
      const { onDidAddListener: origListenerDidAdd } = options;
      const stack = Stacktrace.create();
      let count = 0;
      options.onDidAddListener = () => {
        if (++count === 2) {
          console.warn('snapshotted emitter LIKELY used public and SHOULD HAVE BEEN created with DisposableStore. snapshotted here');
          stack.print();
        }
        origListenerDidAdd?.();
      };
    }
  }

  /**
   * Given an event, returns another event which debounces calls and defers the listeners to a later task via a shared
   * `setTimeout`. The event is converted into a signal (`Event<void>`) to avoid additional object creation as a
   * result of merging events and to try prevent race conditions that could arise when using related deferred and
   * non-deferred events.
   *
   * This is useful for deferring non-critical work (eg. general UI updates) to ensure it does not block critical work
   * (eg. latency of keypress to text rendered).
   *
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   *
   * @param event The event source for the new event.
   * @param disposable A disposable store to add the new EventEmitter to.
   */
  export function defer(event: Event<unknown>, disposable?: DisposableStore): Event<void> {
    return debounce<unknown, void>(event, () => void 0, 0, undefined, true, undefined, disposable);
  }

  /**
   * Given an event, returns another event which only fires once.
   *
   * @param event The event source for the new event.
   */
  export function once<T>(event: Event<T>): Event<T> {
    return (listener, thisArgs = null, disposables?) => {
      // we need this, in case the event fires during the listener call
      let didFire = false;
      let result: IDisposable | undefined = undefined;
      result = event(e => {
        if (didFire) {
          return;
        } else if (result) {
          result.dispose();
        } else {
          didFire = true;
        }

        return listener.call(thisArgs, e);
      }, null, disposables);

      if (didFire) {
        result.dispose();
      }

      return result;
    };
  }

  /**
   * Maps an event of one type into an event of another type using a mapping function, similar to how
   * `Array.prototype.map` works.
   *
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   *
   * @param event The event source for the new event.
   * @param map The mapping function.
   * @param disposable A disposable store to add the new EventEmitter to.
   */
  export function map<I, O>(event: Event<I>, map: (i: I) => O, disposable?: DisposableStore): Event<O> {
    return snapshot((listener, thisArgs = null, disposables?) => event(i => listener.call(thisArgs, map(i)), null, disposables), disposable);
  }

  /**
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   */
  export function forEach<I>(event: Event<I>, each: (i: I) => void, disposable?: DisposableStore): Event<I> {
    return snapshot((listener, thisArgs = null, disposables?) => event(i => { each(i); listener.call(thisArgs, i); }, null, disposables), disposable);
  }

  /**
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   */
  export function filter<T, U>(event: Event<T | U>, filter: (e: T | U) => e is T, disposable?: DisposableStore): Event<T>;
  export function filter<T>(event: Event<T>, filter: (e: T) => boolean, disposable?: DisposableStore): Event<T>;
  export function filter<T, R>(event: Event<T | R>, filter: (e: T | R) => e is R, disposable?: DisposableStore): Event<R>;
  export function filter<T>(event: Event<T>, filter: (e: T) => boolean, disposable?: DisposableStore): Event<T> {
    return snapshot((listener, thisArgs = null, disposables?) => event(e => filter(e) && listener.call(thisArgs, e), null, disposables), disposable);
  }

  /**
   * Given an event, returns the same event but typed as `Event<void>`.
   */
  export function signal<T>(event: Event<T>): Event<void> {
    return event as Event<any> as Event<void>;
  }

  /**
   * Given a collection of events, returns a single event which emits
   * whenever any of the provided events emit.
   */
  export function any<T>(...events: Event<T>[]): Event<T>;
  export function any(...events: Event<any>[]): Event<void>;
  export function any<T>(...events: Event<T>[]): Event<T> {
    return (listener, thisArgs = null, disposables?) => combinedDisposable(...events.map(event => event(e => listener.call(thisArgs, e), null, disposables)));
  }

  /**
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   */
  export function reduce<I, O>(event: Event<I>, merge: (last: O | undefined, event: I) => O, initial?: O, disposable?: DisposableStore): Event<O> {
    let output: O | undefined = initial;

    return map<I, O>(event, e => {
      output = merge(output, e);
      return output;
    }, disposable);
  }

  function snapshot<T>(event: Event<T>, disposable: DisposableStore | undefined): Event<T> {
    let listener: IDisposable | undefined;

    const options: EmitterOptions | undefined = {
      onWillAddFirstListener() {
        listener = event(emitter.fire, emitter);
      },
      onDidRemoveLastListener() {
        listener?.dispose();
      }
    };

    if (!disposable) {
      _addLeakageTraceLogic(options);
    }

    const emitter = new Emitter<T>(options);

    disposable?.add(emitter);

    return emitter.event;
  }

  /**
   * Given an event, creates a new emitter that event that will debounce events based on {@link delay} and give an
   * array event object of all events that fired.
   *
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   *
   * @param event The original event to debounce.
   * @param merge A function that reduces all events into a single event.
   * @param delay The number of milliseconds to debounce.
   * @param leading Whether to fire a leading event without debouncing.
   * @param flushOnListenerRemove Whether to fire all debounced events when a listener is removed. If this is not
   * specified, some events could go missing. Use this if it's important that all events are processed, even if the
   * listener gets disposed before the debounced event fires.
   * @param leakWarningThreshold See {@link EmitterOptions.leakWarningThreshold}.
   * @param disposable A disposable store to register the debounce emitter to.
   */
  export function debounce<T>(event: Event<T>, merge: (last: T | undefined, event: T) => T, delay?: number | typeof MicrotaskDelay, leading?: boolean, flushOnListenerRemove?: boolean, leakWarningThreshold?: number, disposable?: DisposableStore): Event<T>;
  export function debounce<I, O>(event: Event<I>, merge: (last: O | undefined, event: I) => O, delay?: number | typeof MicrotaskDelay, leading?: boolean, flushOnListenerRemove?: boolean, leakWarningThreshold?: number, disposable?: DisposableStore): Event<O>;
  export function debounce<I, O>(event: Event<I>, merge: (last: O | undefined, event: I) => O, delay: number | typeof MicrotaskDelay = 100, leading = false, flushOnListenerRemove = false, leakWarningThreshold?: number, disposable?: DisposableStore): Event<O> {
    let subscription: IDisposable;
    let output: O | undefined = undefined;
    let handle: any = undefined;
    let numDebouncedCalls = 0;
    let doFire: (() => void) | undefined;

    const options: EmitterOptions | undefined = {
      leakWarningThreshold,
      onWillAddFirstListener() {
        subscription = event(cur => {
          numDebouncedCalls++;
          output = merge(output, cur);

          if (leading && !handle) {
            emitter.fire(output);
            output = undefined;
          }

          doFire = () => {
            const _output = output;
            output = undefined;
            handle = undefined;
            if (!leading || numDebouncedCalls > 1) {
              emitter.fire(_output!);
            }
            numDebouncedCalls = 0;
          };

          if (typeof delay === 'number') {
            clearTimeout(handle);
            handle = setTimeout(doFire, delay);
          } else {
            if (handle === undefined) {
              handle = 0;
              queueMicrotask(doFire);
            }
          }
        });
      },
      onWillRemoveListener() {
        if (flushOnListenerRemove && numDebouncedCalls > 0) {
          doFire?.();
        }
      },
      onDidRemoveLastListener() {
        doFire = undefined;
        subscription.dispose();
      }
    };

    if (!disposable) {
      _addLeakageTraceLogic(options);
    }

    const emitter = new Emitter<O>(options);

    disposable?.add(emitter);

    return emitter.event;
  }

  /**
   * Debounces an event, firing after some delay (default=0) with an array of all event original objects.
   *
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   */
  export function accumulate<T>(event: Event<T>, delay: number = 0, disposable?: DisposableStore): Event<T[]> {
    return Event.debounce<T, T[]>(event, (last, e) => {
      if (!last) {
        return [e];
      }
      last.push(e);
      return last;
    }, delay, undefined, true, undefined, disposable);
  }

  /**
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   */
  export function latch<T>(event: Event<T>, equals: (a: T, b: T) => boolean = (a, b) => a === b, disposable?: DisposableStore): Event<T> {
    let firstCall = true;
    let cache: T;

    return filter(event, value => {
      const shouldEmit = firstCall || !equals(value, cache);
      firstCall = false;
      cache = value;
      return shouldEmit;
    }, disposable);
  }

  /**
   * Splits an event whose parameter is a union type into 2 separate events for each type in the union.
   *
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   *
   * @example
   * ```
   * const event = new EventEmitter<number | undefined>().event;
   * const [numberEvent, undefinedEvent] = Event.split(event, isUndefined);
   * ```
   *
   * @param event The event source for the new event.
   * @param isT A function that determines what event is of the first type.
   * @param disposable A disposable store to add the new EventEmitter to.
   */
  export function split<T, U>(event: Event<T | U>, isT: (e: T | U) => e is T, disposable?: DisposableStore): [Event<T>, Event<U>] {
    return [
      Event.filter(event, isT, disposable),
      Event.filter(event, e => !isT(e), disposable) as Event<U>,
    ];
  }

  /**
   * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
   * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
   * returned event causes this utility to leak a listener on the original event.
   */
  export function buffer<T>(event: Event<T>, flushAfterTimeout = false, _buffer: T[] = []): Event<T> {
    let buffer: T[] | null = _buffer.slice();

    let listener: IDisposable | null = event(e => {
      if (buffer) {
        buffer.push(e);
      } else {
        emitter.fire(e);
      }
    });

    const flush = () => {
      buffer?.forEach(e => emitter.fire(e));
      buffer = null;
    };

    const emitter = new Emitter<T>({
      onWillAddFirstListener() {
        if (!listener) {
          listener = event(e => emitter.fire(e));
        }
      },

      onDidAddFirstListener() {
        if (buffer) {
          if (flushAfterTimeout) {
            setTimeout(flush);
          } else {
            flush();
          }
        }
      },

      onDidRemoveLastListener() {
        if (listener) {
          listener.dispose();
        }
        listener = null;
      }
    });

    return emitter.event;
  }

  export interface IChainableEvent<T> extends IDisposable {

    event: Event<T>;
    map<O>(fn: (i: T) => O): IChainableEvent<O>;
    forEach(fn: (i: T) => void): IChainableEvent<T>;
    filter(fn: (e: T) => boolean): IChainableEvent<T>;
    filter<R>(fn: (e: T | R) => e is R): IChainableEvent<R>;
    reduce<R>(merge: (last: R | undefined, event: T) => R, initial?: R): IChainableEvent<R>;
    latch(): IChainableEvent<T>;
    debounce(merge: (last: T | undefined, event: T) => T, delay?: number, leading?: boolean, flushOnListenerRemove?: boolean, leakWarningThreshold?: number): IChainableEvent<T>;
    debounce<R>(merge: (last: R | undefined, event: T) => R, delay?: number, leading?: boolean, flushOnListenerRemove?: boolean, leakWarningThreshold?: number): IChainableEvent<R>;
    on(listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[] | DisposableStore): IDisposable;
    once(listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
  }

  class ChainableEvent<T> implements IChainableEvent<T> {

    private readonly disposables = new DisposableStore();

    constructor(readonly event: Event<T>) { }

    map<O>(fn: (i: T) => O): IChainableEvent<O> {
      return new ChainableEvent(map(this.event, fn, this.disposables));
    }

    forEach(fn: (i: T) => void): IChainableEvent<T> {
      return new ChainableEvent(forEach(this.event, fn, this.disposables));
    }

    filter(fn: (e: T) => boolean): IChainableEvent<T>;
    filter<R>(fn: (e: T | R) => e is R): IChainableEvent<R>;
    filter(fn: (e: T) => boolean): IChainableEvent<T> {
      return new ChainableEvent(filter(this.event, fn, this.disposables));
    }

    reduce<R>(merge: (last: R | undefined, event: T) => R, initial?: R): IChainableEvent<R> {
      return new ChainableEvent(reduce(this.event, merge, initial, this.disposables));
    }

    latch(): IChainableEvent<T> {
      return new ChainableEvent(latch(this.event, undefined, this.disposables));
    }

    debounce(merge: (last: T | undefined, event: T) => T, delay?: number, leading?: boolean, flushOnListenerRemove?: boolean, leakWarningThreshold?: number): IChainableEvent<T>;
    debounce<R>(merge: (last: R | undefined, event: T) => R, delay?: number, leading?: boolean, flushOnListenerRemove?: boolean, leakWarningThreshold?: number): IChainableEvent<R>;
    debounce<R>(merge: (last: R | undefined, event: T) => R, delay: number = 100, leading = false, flushOnListenerRemove = false, leakWarningThreshold?: number): IChainableEvent<R> {
      return new ChainableEvent(debounce(this.event, merge, delay, leading, flushOnListenerRemove, leakWarningThreshold, this.disposables));
    }

    on(listener: (e: T) => any, thisArgs: any, disposables: IDisposable[] | DisposableStore) {
      return this.event(listener, thisArgs, disposables);
    }

    once(listener: (e: T) => any, thisArgs: any, disposables: IDisposable[]) {
      return once(this.event)(listener, thisArgs, disposables);
    }

    dispose() {
      this.disposables.dispose();
    }
  }

  export function chain<T>(event: Event<T>): IChainableEvent<T> {
    return new ChainableEvent(event);
  }

  export interface NodeEventEmitter {
    on(event: string | symbol, listener: Function): unknown;
    removeListener(event: string | symbol, listener: Function): unknown;
  }

  export function fromNodeEventEmitter<T>(emitter: NodeEventEmitter, eventName: string, map: (...args: any[]) => T = id => id): Event<T> {
    const fn = (...args: any[]) => result.fire(map(...args));
    const onFirstListenerAdd = () => emitter.on(eventName, fn);
    const onLastListenerRemove = () => emitter.removeListener(eventName, fn);
    const result = new Emitter<T>({ onWillAddFirstListener: onFirstListenerAdd, onDidRemoveLastListener: onLastListenerRemove });

    return result.event;
  }

  export interface DOMEventEmitter {
    addEventListener(event: string | symbol, listener: Function): void;
    removeEventListener(event: string | symbol, listener: Function): void;
  }

  export function fromDOMEventEmitter<T>(emitter: DOMEventEmitter, eventName: string, map: (...args: any[]) => T = id => id): Event<T> {
    const fn = (...args: any[]) => result.fire(map(...args));
    const onFirstListenerAdd = () => emitter.addEventListener(eventName, fn);
    const onLastListenerRemove = () => emitter.removeEventListener(eventName, fn);
    const result = new Emitter<T>({ onWillAddFirstListener: onFirstListenerAdd, onDidRemoveLastListener: onLastListenerRemove });

    return result.event;
  }

  export function toPromise<T>(event: Event<T>): Promise<T> {
    return new Promise(resolve => once(event)(resolve));
  }

  export function runAndSubscribe<T>(event: Event<T>, handler: (e: T | undefined) => any): IDisposable {
    handler(undefined);
    return event(e => handler(e));
  }

  export function runAndSubscribeWithStore<T>(event: Event<T>, handler: (e: T | undefined, disposableStore: DisposableStore) => any): IDisposable {
    let store: DisposableStore | null = null;

    function run(e: T | undefined) {
      store?.dispose();
      store = new DisposableStore();
      handler(e, store);
    }

    run(undefined);
    const disposable = event(e => run(e));
    return toDisposable(() => {
      disposable.dispose();
      store?.dispose();
    });
  }

  class EmitterObserver<T> implements IObserver {

    readonly emitter: Emitter<T>;

    private _counter = 0;
    private _hasChanged = false;

    constructor(readonly obs: IObservable<T, any>, store: DisposableStore | undefined) {
      const options: EmitterOptions = {
        onWillAddFirstListener: () => {
          obs.addObserver(this);
        },
        onDidRemoveLastListener: () => {
          obs.removeObserver(this);
        }
      };
      if (!store) {
        _addLeakageTraceLogic(options);
      }
      this.emitter = new Emitter<T>(options);
      if (store) {
        store.add(this.emitter);
      }
    }

    beginUpdate<T>(_observable: IObservable<T, void>): void {
      // console.assert(_observable === this.obs);
      this._counter++;
    }

    handleChange<T, TChange>(_observable: IObservable<T, TChange>, _change: TChange): void {
      this._hasChanged = true;
    }

    endUpdate<T>(_observable: IObservable<T, void>): void {
      if (--this._counter === 0) {
        if (this._hasChanged) {
          this._hasChanged = false;
          this.emitter.fire(this.obs.get());
        }
      }
    }
  }

  export function fromObservable<T>(obs: IObservable<T, any>, store?: DisposableStore): Event<T> {
    const observer = new EmitterObserver(obs, store);
    return observer.emitter.event;
  }
}


export interface EmitterOptions {
  /**
   * Optional function that's called *before* the very first listener is added
   */
  onWillAddFirstListener?: Function;
  /**
   * Optional function that's called *after* the very first listener is added
   */
  onDidAddFirstListener?: Function;
  /**
   * Optional function that's called after a listener is added
   */
  onDidAddListener?: Function;
  /**
   * Optional function that's called *after* remove the very last listener
   */
  onDidRemoveLastListener?: Function;
  /**
   * Optional function that's called *before* a listener is removed
   */
  onWillRemoveListener?: Function;
  /**
   * Optional function that's called when a listener throws an error. Defaults to
   * {@link onUnexpectedError}
   */
  onListenerError?: (e: any) => void;
  /**
   * Number of listeners that are allowed before assuming a leak. Default to
   * a globally configured value
   *
   * @see setGlobalLeakWarningThreshold
   */
  leakWarningThreshold?: number;
  /**
   * Pass in a delivery queue, which is useful for ensuring
   * in order event delivery across multiple emitters.
   */
  deliveryQueue?: EventDeliveryQueue;

  /** ONLY enable this during development */
  _profName?: string;
}

class LeakageMonitor {

  private _stacks: Map<string, number> | undefined;
  private _warnCountdown: number = 0;

  constructor(
    readonly threshold: number,
    readonly name: string = Math.random().toString(18).slice(2, 5),
  ) { }

  dispose(): void {
    this._stacks?.clear();
  }

  check(stack: Stacktrace, listenerCount: number): undefined | (() => void) {

    const threshold = this.threshold;
    if (threshold <= 0 || listenerCount < threshold) {
      return undefined;
    }

    if (!this._stacks) {
      this._stacks = new Map();
    }
    const count = (this._stacks.get(stack.value) || 0);
    this._stacks.set(stack.value, count + 1);
    this._warnCountdown -= 1;

    if (this._warnCountdown <= 0) {
      // only warn on first exceed and then every time the limit
      // is exceeded by 50% again
      this._warnCountdown = threshold * 0.5;

      // find most frequent listener and print warning
      let topStack: string | undefined;
      let topCount: number = 0;
      for (const [stack, count] of this._stacks) {
        if (!topStack || topCount < count) {
          topStack = stack;
          topCount = count;
        }
      }

      console.warn(`[${this.name}] potential listener LEAK detected, having ${listenerCount} listeners already. MOST frequent listener (${topCount}):`);
      console.warn(topStack!);
    }

    return () => {
      const count = (this._stacks!.get(stack.value) || 0);
      this._stacks!.set(stack.value, count - 1);
    };
  }
}

class Stacktrace {
  static create() {
    return new Stacktrace(new Error().stack ?? '');
  }

  private constructor(readonly value: string) {}

  print() {
    console.warn(this.value.split('\n').slice(2).join('\n'));
  }
}

class Listener<T> {
  readonly subscription = new SafeDisposable();

  constructor(
    readonly callback: (e: T) => void,
    readonly callbackThis: any | undefined,
    readonly stack: Stacktrace | undefined,
  ) {}

  invoke(e: T) {
    this.callback.call(this.callbackThis, e);
  }
}

/**
 * The Emitter can be used to expose an Event to the public
 * to fire it from the insides.
 * Sample:
 class Document {

		private readonly _onDidChange = new Emitter<(value:string)=>any>();

		public onDidChange = this._onDidChange.event;

		// getter-style
		// get onDidChange(): Event<(value:string)=>any> {
		// 	return this._onDidChange.event;
		// }

		private _doIt() {
			//...
			this._onDidChange.fire(value);
		}
	}
 */
export class Emitter<T> {

  private readonly _options?: EmitterOptions;
  private readonly _leakageMon?: LeakageMonitor;
  private readonly _perfMon?: EventProfiling;
  private _disposed: boolean = false;
  private _event?: Event<T>;
  private _deliveryQueue?: EventDeliveryQueue;
  protected _listeners?: LinkedList<Listener<T>>;

  constructor(options?: EmitterOptions) {
    this._options = options;
    this._leakageMon = _globalLeakWarningThreshold > 0 || this._options?.leakWarningThreshold ? new LeakageMonitor(this._options?.leakWarningThreshold ?? _globalLeakWarningThreshold) : undefined;
    this._perfMon = this._options?._profName ? new EventProfiling(this._options._profName) : undefined;
    this._deliveryQueue = this._options?.deliveryQueue;
  }

  dispose() {
    if (!this._disposed) {
      this._disposed = true;

      // It is bad to have listeners at the time of disposing an emitter, it is worst to have listeners keep the emitter
      // alive via the reference that's embedded in their disposables. Therefore we loop over all remaining listeners and
      // unset their subscriptions/disposables. Looping and blaming remaining listeners is done on next tick because the
      // the following programming pattern is very popular:
      //
      // const someModel = this._disposables.add(new ModelObject()); // (1) create and register model
      // this._disposables.add(someModel.onDidChange(() => { ... }); // (2) subscribe and register model-event listener
      // ...later...
      // this._disposables.dispose(); disposes (1) then (2): don't warn after (1) but after the "overall dispose" is done

      if (this._listeners) {
        if (_enableDisposeWithListenerWarning) {
          const listeners = Array.from(this._listeners);
          queueMicrotask(() => {
            for (const listener of listeners) {
              if (listener.subscription.isset()) {
                listener.subscription.unset();
                listener.stack?.print();
              }
            }
          });
        }

        this._listeners.clear();
      }
      this._deliveryQueue?.clear(this);
      this._options?.onDidRemoveLastListener?.();
      this._leakageMon?.dispose();
    }
  }

  /**
   * For the public to allow to subscribe
   * to events from this Emitter
   */
  get event(): Event<T> {
    if (!this._event) {
      this._event = (callback: (e: T) => any, thisArgs?: any, disposables?: IDisposable[] | DisposableStore) => {
        if (!this._listeners) {
          this._listeners = new LinkedList();
        }

        if (this._leakageMon && this._listeners.size > this._leakageMon.threshold * 3) {
          console.warn(`[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far`);
          return Disposable.None;
        }

        const firstListener = this._listeners.isEmpty();

        if (firstListener && this._options?.onWillAddFirstListener) {
          this._options.onWillAddFirstListener(this);
        }

        let removeMonitor: Function | undefined;
        let stack: Stacktrace | undefined;
        if (this._leakageMon && this._listeners.size >= Math.ceil(this._leakageMon.threshold * 0.2)) {
          // check and record this emitter for potential leakage
          stack = Stacktrace.create();
          removeMonitor = this._leakageMon.check(stack, this._listeners.size + 1);
        }

        if (_enableDisposeWithListenerWarning) {
          stack = stack ?? Stacktrace.create();
        }

        const listener = new Listener(callback, thisArgs, stack);
        const removeListener = this._listeners.push(listener);

        if (firstListener && this._options?.onDidAddFirstListener) {
          this._options.onDidAddFirstListener(this);
        }

        if (this._options?.onDidAddListener) {
          this._options.onDidAddListener(this, callback, thisArgs);
        }

        const result = listener.subscription.set(() => {
          removeMonitor?.();
          if (!this._disposed) {
            this._options?.onWillRemoveListener?.(this);
            removeListener();
            if (this._options && this._options.onDidRemoveLastListener) {
              const hasListeners = (this._listeners && !this._listeners.isEmpty());
              if (!hasListeners) {
                this._options.onDidRemoveLastListener(this);
              }
            }
          }
        });

        if (disposables instanceof DisposableStore) {
          disposables.add(result);
        } else if (Array.isArray(disposables)) {
          disposables.push(result);
        }

        return result;
      };
    }
    return this._event;
  }

  /**
   * To be kept private to fire an event to
   * subscribers
   */
  fire(event: T): void {
    if (this._listeners) {
      // put all [listener,event]-pairs into delivery queue
      // then emit all event. an inner/nested event might be
      // the driver of this

      if (!this._deliveryQueue) {
        this._deliveryQueue = new PrivateEventDeliveryQueue(this._options?.onListenerError);
      }

      for (const listener of this._listeners) {
        this._deliveryQueue.push(this, listener, event);
      }

      // start/stop performance insight collection
      this._perfMon?.start(this._deliveryQueue.size);

      this._deliveryQueue.deliver();

      this._perfMon?.stop();
    }
  }

  hasListeners(): boolean {
    if (!this._listeners) {
      return false;
    }
    return !this._listeners.isEmpty();
  }
}

export class EventDeliveryQueue {

  protected _queue = new LinkedList<EventDeliveryQueueElement>();

  constructor(
    private readonly _onListenerError: (e: any) => void = onUnexpectedError
  ) { }

  get size(): number {
    return this._queue.size;
  }

  push<T>(emitter: Emitter<T>, listener: Listener<T>, event: T): void {
    this._queue.push(new EventDeliveryQueueElement(emitter, listener, event));
  }

  clear<T>(emitter: Emitter<T>): void {
    const newQueue = new LinkedList<EventDeliveryQueueElement>();
    for (const element of this._queue) {
      if (element.emitter !== emitter) {
        newQueue.push(element);
      }
    }
    this._queue = newQueue;
  }

  deliver(): void {
    while (this._queue.size > 0) {
      const element = this._queue.shift()!;
      try {
        element.listener.invoke(element.event);
      } catch (e) {
        this._onListenerError(e);
      }
    }
  }
}

/**
 * An `EventDeliveryQueue` that is guaranteed to be used by a single `Emitter`.
 */
class PrivateEventDeliveryQueue extends EventDeliveryQueue {
  override clear<T>(emitter: Emitter<T>): void {
    // Here we can just clear the entire linked list because
    // all elements are guaranteed to belong to this emitter
    this._queue.clear();
  }
}

class EventDeliveryQueueElement<T = any> {
  constructor(
    readonly emitter: Emitter<T>,
    readonly listener: Listener<T>,
    readonly event: T
  ) { }
}

export type IWaitUntilData<T> = Omit<Omit<T, 'waitUntil'>, 'token'>;

export class AsyncEmitter<T extends IWaitUntil> extends Emitter<T> {
  private _asyncDeliveryQueue?: LinkedList<[Listener<T>, IWaitUntilData<T>]>;

  async fireAsync(
    data: IWaitUntilData<T>,
    token: CancellationToken,
    promiseJoin?: (p: Promise<unknown>, listener: Function) => Promise<unknown>,
  ): Promise<void> {
    if (!this._listeners) {
      return;
    }

    if (!this._asyncDeliveryQueue) {
      this._asyncDeliveryQueue = new LinkedList();
    }

    for (const listener of this._listeners) {
      this._asyncDeliveryQueue.push([listener, data]);
    }

    while (this._asyncDeliveryQueue.size > 0 && !token.isCancellationRequested) {
      const [listener, data] = this._asyncDeliveryQueue.shift()!;
      const thenables: Promise<unknown>[] = [];

      const event = <T>{
        ...data,
        token,
        waitUntil: (p: Promise<unknown>): void => {
          if (Object.isFrozen(thenables)) {
            throw new Error('waitUntil can NOT be called asynchronous');
          }
          if (promiseJoin) {
            p = promiseJoin(p, listener.callback);
          }
          thenables.push(p);
        },
      };

      try {
        listener.invoke(event);
      } catch (e) {
        onUnexpectedError(e);
        continue;
      }

      // freeze thenables-collection to enforce sync-calls to
      // wait until and then wait for all thenables to resolve
      Object.freeze(thenables);

      await Promise.allSettled(thenables).then((values) => {
        for (const value of values) {
          if (value.status === 'rejected') {
            onUnexpectedError(value.reason);
          }
        }
      });
    }
  }
}

export class PauseableEmitter<T> extends Emitter<T> {
  private _isPaused = 0;
  private _eventQueue = new LinkedList<T>();
  private _mergeFn?: (input: T[]) => T;

  constructor(options?: EmitterOptions & { merge?: (input: T[]) => T }) {
    super(options);
    this._mergeFn = options?.merge;
  }

  pause(): void {
    this._isPaused++;
  }

  resume(): void {
    if (this._isPaused !== 0 && --this._isPaused === 0) {
      if (this._mergeFn) {
        // use the merge function to create a single composite
        // event. make a copy in case firing pauses this emitter
        const events = Array.from(this._eventQueue);
        this._eventQueue.clear();
        super.fire(this._mergeFn(events));
      } else {
        // no merging, fire each event individually and test
        // that this emitter isn't paused halfway through
        while (!this._isPaused && this._eventQueue.size !== 0) {
          super.fire(this._eventQueue.shift()!);
        }
      }
    }
  }

  fire(event: T): void {
    if (this._listeners) {
      if (this._isPaused !== 0) {
        this._eventQueue.push(event);
      } else {
        super.fire(event);
      }
    }
  }
}

