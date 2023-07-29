import { SchedulerJob } from './scheduler';
import { EMPTY_OBJ, isObject, isArray, isFunction, hasChanged, NOOP, isMap, isSet, isPlainObject } from '@vue/shared';
import { ErrorCodes, callWithErrorHandling, callWithAsyncErrorHandling } from './errorHandling';
import { warn } from './warning';
import { isRef, Ref } from './ref';
import { DebuggerOptions, EffectScheduler, ReactiveEffect } from './effect';
import { isReactive, ReactiveFlags } from './reactive';

export type WatchEffect = (onInvalidate: InvalidateCbRegistrator) => void;

export type WatchSource<T = any> = Ref<T> | (() => T);

export type WatchCallback<V = any, OV = any> = (value: V, oldValue: OV, onInvalidate: InvalidateCbRegistrator) => any;

type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V> ? (Immediate extends true ? V | undefined : V) : T[K] extends object ? (Immediate extends true ? T[K] | undefined : T[K]) : never;
};

type InvalidateCbRegistrator = (cb: () => void) => void;

export interface WatchOptionsBase extends DebuggerOptions {}

export interface WatchOptions<Immediate = boolean> extends WatchOptionsBase {
  immediate?: Immediate;
  deep?: boolean;
}

export type WatchStopHandle = () => void;

// Simple effect.
export function watchEffect(effect: WatchEffect, options?: WatchOptionsBase): WatchStopHandle {
  return doWatch(effect, null, options);
}

// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {};

type MultiWatchSources = (WatchSource<unknown> | object)[];

// overload: array of multiple sources + cb
export function watch<T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(sources: [...T], cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>, options?: WatchOptions<Immediate>): WatchStopHandle;

// overload: multiple sources w/ `as const`
// watch([foo, bar] as const, () => {})
// somehow [...T] breaks when the type is readonly
export function watch<T extends Readonly<MultiWatchSources>, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>, options?: WatchOptions<Immediate>): WatchStopHandle;

// overload: single source + cb
export function watch<T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchOptions<Immediate>): WatchStopHandle;

// overload: watching reactive object w/ cb
export function watch<T extends object, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchOptions<Immediate>): WatchStopHandle;

// implementation
export function watch<T = any, Immediate extends Readonly<boolean> = false>(source: T | WatchSource<T>, cb: any, options?: WatchOptions<Immediate>): WatchStopHandle {
  if (!isFunction(cb)) {
    warn(`\`watch(fn, options?)\` signature has been moved to a separate API. ` + `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` + `supports \`watch(source, cb, options?) signature.`);
  }
  return doWatch(source as any, cb, options);
}

export function doWatch(source: WatchSource | WatchSource[] | WatchEffect | object, cb: WatchCallback | null, { immediate, deep, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ): WatchStopHandle {
  if (!cb) {
    if (immediate !== undefined) {
      warn(`watch() "immediate" option is only respected when using the ` + `watch(source, callback, options?) signature.`);
    }
    if (deep !== undefined) {
      warn(`watch() "deep" option is only respected when using the ` + `watch(source, callback, options?) signature.`);
    }
  }

  const warnInvalidSource = (s: unknown) => {
    warn(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, ` + `a reactive object, or an array of these types.`);
  };

  let getter: () => any;
  let forceTrigger = false;
  let isMultiSource = false;

  if (isRef(source)) {
    getter = () => source.value;
    forceTrigger = !!source._shallow;
  } else if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isArray(source)) {
    isMultiSource = true;
    forceTrigger = source.some(isReactive);
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value;
        } else if (isReactive(s)) {
          return traverse(s);
        } else if (isFunction(s)) {
          return callWithErrorHandling(s, ErrorCodes.WATCH_GETTER);
        } else {
          warnInvalidSource(s);
        }
        return undefined;
      });
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () => callWithErrorHandling(source, ErrorCodes.WATCH_GETTER);
    } else {
      // no cb -> simple effect
      getter = () => {
        if (cleanup) {
          cleanup();
        }
        return callWithAsyncErrorHandling(source, ErrorCodes.WATCH_CALLBACK, [onInvalidate]);
      };
    }
  } else {
    getter = NOOP;
    warnInvalidSource(source);
  }

  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  let cleanup: () => void;
  const onInvalidate: InvalidateCbRegistrator = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, ErrorCodes.WATCH_CLEANUP);
    };
  };

  let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE;
  const job: SchedulerJob = () => {
    if (!effect.active) {
      return;
    }
    if (cb) {
      // watch(source, cb)
      const newValue = effect.run();
      if (deep || forceTrigger || (isMultiSource ? (newValue as any[]).some((v, i) => hasChanged(v, (oldValue as any[])[i])) : hasChanged(newValue, oldValue))) {
        // cleanup before running cb again
        if (cleanup) {
          cleanup();
        }
        callWithAsyncErrorHandling(cb, ErrorCodes.WATCH_CALLBACK, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
          onInvalidate,
        ]);
        oldValue = newValue;
      }
    } else {
      // watchEffect
      effect.run();
    }
  };

  // important: mark the job as a watcher callback so that scheduler knows
  // it is allowed to self-trigger (#1727)
  job.allowRecurse = !!cb;

  const scheduler: EffectScheduler = job as any; // the scheduler function gets called directly

  const effect = new ReactiveEffect(getter, scheduler);

  // if (__DEV__) {
  effect.onTrack = onTrack;
  effect.onTrigger = onTrigger;
  // }

  // initial run
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    effect.run();
  }

  return () => {
    effect.stop();
  };
}

export function traverse(value: unknown, seen: Set<unknown> = new Set()) {
  if (!isObject(value) || (value as any)[ReactiveFlags.SKIP]) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse((value as any)[key], seen);
    }
  }
  return value;
}
