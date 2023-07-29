import { TrackOpTypes, TriggerOpTypes } from './operations';
import { extend, isArray, isFunction, isIntegerKey, isMap } from '@vue/shared';
import { EffectScope, recordEffectScope } from './effectScope';
import { createDep, Dep, finalizeDepMarkers, initDepMarkers, newTracked, wasTracked } from './dep';

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
type KeyToDepMap = Map<any, Dep>;
const targetMap = new WeakMap<any, KeyToDepMap>();

// The number of effects currently being tracked recursively.
let effectTrackDepth = 0;

export let trackOpBit = 1;

/**
 * The bitwise track markers support at most 30 levels op recursion.
 * This value is chosen to enable modern JS engines to use a SMI on all platforms.
 * When recursion depth is greater, fall back to using a full cleanup.
 */
const maxMarkerBits = 30;

export type EffectScheduler = (...args: any[]) => any;

export type DebuggerEvent = {
  effect: ReactiveEffect;
} & DebuggerEventExtraInfo;

export type DebuggerEventExtraInfo = {
  target: object;
  type: TrackOpTypes | TriggerOpTypes;
  key: any;
  newValue?: any;
  oldValue?: any;
  oldTarget?: Map<any, any> | Set<any>;
};

const effectStack: ReactiveEffect[] = [];
let activeEffect: ReactiveEffect | undefined;

export const ITERATE_KEY = Symbol('iterate');
export const MAP_KEY_ITERATE_KEY = Symbol('Map key iterate');

export class ReactiveEffect<T = any> {
  active = true;
  deps: Dep[] = [];

  // can be attached after creation
  computed?: boolean;
  allowRecurse?: boolean;
  onStop?: () => void;
  // dev only
  onTrack?: (event: DebuggerEvent) => void;
  // dev only
  onTrigger?: (event: DebuggerEvent) => void;

  constructor(public fn: () => T, public scheduler: EffectScheduler | null = null, scope?: EffectScope | null) {
    recordEffectScope(this, scope);
  }

  run() {
    if (!this.active) {
      return this.fn();
    }
    if (!effectStack.includes(this)) {
      try {
        effectStack.push((activeEffect = this));
        enableTracking();

        trackOpBit = 1 << ++effectTrackDepth;

        if (effectTrackDepth <= maxMarkerBits) {
          initDepMarkers(this);
        } else {
          cleanupEffect(this);
        }
        return this.fn();
      } finally {
        if (effectTrackDepth <= maxMarkerBits) {
          finalizeDepMarkers(this);
        }

        trackOpBit = 1 << --effectTrackDepth;

        resetTracking();
        effectStack.pop();
        const n = effectStack.length;
        activeEffect = n > 0 ? effectStack[n - 1] : undefined;
      }
    }
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

export interface DebuggerOptions {
  onTrack?: (event: DebuggerEvent) => void;
  onTrigger?: (event: DebuggerEvent) => void;
}

export interface ReactiveEffectOptions extends DebuggerOptions {
  lazy?: boolean;
  scheduler?: EffectScheduler;
  scope?: EffectScope;
  allowRecurse?: boolean;
  onStop?: () => void;
}

export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions): ReactiveEffectRunner {
  if ((fn as ReactiveEffectRunner).effect) {
    fn = (fn as ReactiveEffectRunner).effect.fn;
  }

  const _effect = new ReactiveEffect(fn);
  if (options) {
    extend(_effect, options);
    if (options.scope) recordEffectScope(_effect, options.scope);
  }
  if (!options || !options.lazy) {
    _effect.run();
  }
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
  runner.effect = _effect;
  return runner;
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop();
}

let shouldTrack = true;
const trackStack: boolean[] = [];

export function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}

export function enableTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = true;
}

export function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === undefined ? true : last;
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!isTracking()) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep()));
  }

  const eventInfo = { effect: activeEffect, target, type, key };

  trackEffects(dep, eventInfo);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trackEffects(dep: Dep, debuggerEventExtraInfo?: DebuggerEventExtraInfo) {
  let shouldTrack = false;
  if (effectTrackDepth <= maxMarkerBits) {
    if (!newTracked(dep)) {
      dep.n |= trackOpBit; // set newly tracked
      shouldTrack = !wasTracked(dep);
    }
  } else {
    // Full cleanup mode.
    shouldTrack = !dep.has(activeEffect!);
  }

  if (shouldTrack) {
    dep.add(activeEffect!);
    activeEffect!.deps.push(dep);
    if (activeEffect!.onTrack) {
      activeEffect!.onTrack(
        Object.assign(
          {
            effect: activeEffect!,
          },
          debuggerEventExtraInfo,
        ),
      );
    }
  }
}

export function trigger(target: object, type: TriggerOpTypes, key?: unknown, newValue?: unknown, oldValue?: unknown, oldTarget?: Map<unknown, unknown> | Set<unknown>) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // never been tracked
    return;
  }

  let deps: (Dep | undefined)[] = [];
  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    deps = [...depsMap.values()];
  } else if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        deps.push(dep);
      }
    });
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      deps.push(depsMap.get(key));
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else if (isIntegerKey(key)) {
          // new index added to array -> length changes
          deps.push(depsMap.get('length'));
        }
        break;
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else {
          deps.push(depsMap.get('length'));
        }
        break;
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
        }
        break;
    }
  }

  const eventInfo = { target, type, key, newValue, oldValue, oldTarget };

  if (deps.length === 1) {
    if (deps[0]) {
      triggerEffects(deps[0], eventInfo);
    }
  } else {
    const effects: ReactiveEffect[] = [];
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep);
      }
    }
    triggerEffects(createDep(effects), eventInfo);
  }
}

export function triggerEffects(dep: Dep | ReactiveEffect[], debuggerEventExtraInfo?: DebuggerEventExtraInfo) {
  // spread into array for stabilization
  for (const effect of isArray(dep) ? dep : [...dep]) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (isFunction(effect.onTrigger)) {
        effect.onTrigger(extend({ effect }, debuggerEventExtraInfo));
      }
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  }
}
