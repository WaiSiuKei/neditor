import { reactive, toRaw, ReactiveFlags, Target, reactiveMap } from './reactive';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { track, trigger, ITERATE_KEY, pauseTracking, resetTracking } from './effect';
import { isObject, hasOwn, isSymbol, hasChanged, isArray, isIntegerKey, makeMap } from '@vue/shared';
import { isRef } from './ref';
import { trackParentChain, trackMutation, isMutating } from './patch';

const isNonTrackableKeys = /* #__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => (Symbol as any)[key])
    .filter(isSymbol),
);

const arrayInstrumentations = /* #__PURE__ */ createArrayInstrumentations();

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {};
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  (['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any;
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, TrackOpTypes.GET, i + '');
      }
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args);
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  (['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking();
      const res = (toRaw(this) as any)[key].apply(this, args);
      resetTracking();
      return res;
    };
  });
  return instrumentations;
}

function get(target: Target, key: string | symbol, receiver: object) {
  if (key === ReactiveFlags.IS_REACTIVE) {
    return true;
  } else if (key === ReactiveFlags.RAW && receiver === reactiveMap.get(target)) {
    return target;
  }

  const targetIsArray = isArray(target);

  if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
    return Reflect.get(arrayInstrumentations, key, receiver);
  }

  const res = Reflect.get(target, key, receiver);

  if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
    return res;
  }

  track(target, TrackOpTypes.GET, key);

  if (isRef(res)) {
    throw new Error('500');
    // ref unwrapping - does not apply for Array + integer key.
    const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
    return shouldUnwrap ? res.value : res;
  }

  if (isObject(res)) {
    // Convert returned value into a proxy as well. we do the isObject check
    // here to avoid invalid value warning. Also need to lazy access readonly
    // and reactive here to avoid circular dependency.
    const ret = reactive(res);
    trackParentChain(ret, key as string, receiver);
    return ret;
  }

  return res;
}

function set(target: object, key: string | symbol, value: unknown, receiver: object): boolean {
  if (!isMutating()) {
    // if (__DEV__) {
    console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
    // }
    return true;
  }
  let oldValue = (target as any)[key];
  value = toRaw(value);
  oldValue = toRaw(oldValue);
  if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
    throw new Error('500');
    oldValue.value = value;
    return true;
  }

  const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
  const result = Reflect.set(target, key, value, receiver);
  // don't trigger if target is something up in the prototype chain of original
  if (target === toRaw(receiver)) {
    if (!hadKey) {
      trigger(target, TriggerOpTypes.ADD, key, value);
      trackMutation(receiver, TriggerOpTypes.ADD, key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      trackMutation(receiver, TriggerOpTypes.SET, key, value, oldValue);
    }
  }
  return result;
}

function deleteProperty(target: object, key: string | symbol): boolean {
  if (!isMutating()) {
    // if (__DEV__) {
    console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
    // }
    return true;
  }
  const hadKey = hasOwn(target, key);
  const oldValue = (target as any)[key];
  const result = Reflect.deleteProperty(target, key);
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue);
    trackMutation(target, TriggerOpTypes.DELETE, key, undefined, oldValue);
  }
  return result;
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key);
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, TrackOpTypes.HAS, key);
  }
  return result;
}

function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY);
  return Reflect.ownKeys(target);
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys,
};
