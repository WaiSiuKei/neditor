import { isTracking, trackEffects, triggerEffects } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { isArray, isObject, hasChanged } from '@vue/shared';
import { reactive, isProxy, toRaw, isReactive } from './reactive';
import { createDep, Dep } from './dep';

export declare const RefSymbol: unique symbol;

export interface Ref<T = any> {
  value: T;
  /**
   * Type differentiator only.
   * We need this to be in public d.ts but don't want it to show up in IDE
   * autocomplete, so we use a private Symbol instead.
   */
  [RefSymbol]: true;
  /**
   * @internal
   */
  _shallow?: boolean;

  /**
   * Deps are maintained locally rather than in depsMap for performance reasons.
   */
  dep?: Dep;
}

type RefBase<T> = {
  dep?: Dep;
  value: T;
};

export function trackRefValue(ref: RefBase<any>) {
  if (isTracking()) {
    ref = toRaw(ref);
    if (!ref.dep) {
      ref.dep = createDep();
    }
    trackEffects(ref.dep, {
      target: ref,
      type: TrackOpTypes.GET,
      key: 'value',
    });
  }
}

export function triggerRefValue(ref: RefBase<any>, newVal?: any) {
  ref = toRaw(ref);
  if (ref.dep) {
    triggerEffects(ref.dep, {
      target: ref,
      type: TriggerOpTypes.SET,
      key: 'value',
      newValue: newVal,
    });
  }
}

export type ToRef<T> = [T] extends [Ref] ? T : Ref<UnwrapRef<T>>;
export type ToRefs<T = any> = {
  // #2687: somehow using ToRef<T[K]> here turns the resulting type into
  // a union of multiple Ref<*> types instead of a single Ref<* | *> type.
  [K in keyof T]: T[K] extends Ref ? T[K] : Ref<UnwrapRef<T[K]>>;
};

// @ts-ignore
const convert = <T>(val: T): T => (isObject(val) ? reactive(val) : val);

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>;
export function isRef(r: any): r is Ref {
  return Boolean(r && r.__v_isRef === true);
}

export function ref<T extends object>(value: T): ToRef<T>;
export function ref<T>(value: T): Ref<UnwrapRef<T>>;
export function ref<T = any>(): Ref<T | undefined>;
export function ref(value?: unknown) {
  return createRef(value);
}

export function shallowRef<T extends object>(value: T): T extends Ref ? T : Ref<T>;
export function shallowRef<T>(value: T): Ref<T>;
export function shallowRef<T = any>(): Ref<T | undefined>;
export function shallowRef(value?: unknown) {
  return createRef(value, true);
}

class RefImpl<T> {
  private _value: T;
  private _rawValue: T;

  public dep?: Dep = undefined;
  public readonly __v_isRef = true;

  constructor(value: T, public readonly _shallow = false) {
    this._rawValue = _shallow ? value : toRaw(value);
    this._value = _shallow ? value : convert(value);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal);
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = this._shallow ? newVal : convert(newVal);
      triggerRefValue(this, newVal);
    }
  }
}

function createRef(rawValue: unknown, shallow = false) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

export function triggerRef(ref: Ref) {
  triggerRefValue(ref, ref.value);
}

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? (ref.value as any) : ref;
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

export function proxyRefs<T extends object>(objectWithRefs: T): ShallowUnwrapRef<T> {
  return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

export type CustomRefFactory<T> = (
  track: () => void,
  trigger: () => void,
) => {
  get: () => T;
  set: (value: T) => void;
};

class CustomRefImpl<T> {
  public dep?: Dep = undefined;

  private readonly _get: ReturnType<CustomRefFactory<T>>['get'];
  private readonly _set: ReturnType<CustomRefFactory<T>>['set'];

  public readonly __v_isRef = true;

  constructor(factory: CustomRefFactory<T>) {
    const { get, set } = factory(
      () => trackRefValue(this),
      () => triggerRefValue(this),
    );
    this._get = get;
    this._set = set;
  }

  get value() {
    return this._get();
  }

  set value(newVal) {
    this._set(newVal);
  }
}

export function customRef<T>(factory: CustomRefFactory<T>): Ref<T> {
  return new CustomRefImpl(factory) as any;
}

export function toRefs<T extends object>(object: T): ToRefs<T> {
  if (!isProxy(object)) {
    console.warn(`toRefs() expects a reactive object but received a plain one.`);
  }
  const ret: any = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly __v_isRef = true;

  constructor(private readonly _object: T, private readonly _key: K) {}

  get value() {
    return this._object[this._key];
  }

  set value(newVal) {
    this._object[this._key] = newVal;
  }
}

export function toRef<T extends object, K extends keyof T>(object: T, key: K): ToRef<T[K]> {
  return isRef(object[key]) ? object[key] : (new ObjectRefImpl(object, key) as any);
}

// corner case when use narrows type
// Ex. type RelativePath = string & { __brand: unknown }
// RelativePath extends object -> true
type BaseTypes = string | number | boolean;

/**
 * This is a special exported interface for other packages to declare
 * additional types that should bail out for ref unwrapping. For example
 * \@vue/runtime-dom can declare it like so in its d.ts:
 *
 * ``` ts
 * declare module '@vue/reactivity' {
 *   export interface RefUnwrapBailTypes {
 *     runtimeDOMBailTypes: Node | Window
 *   }
 * }
 * ```
 *
 * Note that api-extractor somehow refuses to include `declare module`
 * augmentations in its generated d.ts, so we have to manually append them
 * to the final generated d.ts in our build process.
 */
export interface RefUnwrapBailTypes {}

export type ShallowUnwrapRef<T> = {
  [K in keyof T]: T[K] extends Ref<infer V>
    ? V
    : T[K] extends Ref<infer V> | undefined // if `V` is `unknown` that means it does not extend `Ref` and is undefined
    ? unknown extends V
      ? undefined
      : V | undefined
    : T[K];
};

export type UnwrapRef<T> = T extends Ref<infer V> ? UnwrapRefSimple<V> : UnwrapRefSimple<T>;

type UnwrapRefSimple<T> = T extends Function | BaseTypes | Ref | RefUnwrapBailTypes[keyof RefUnwrapBailTypes] ? T : T extends Array<any> ? { [K in keyof T]: UnwrapRefSimple<T[K]> } : T extends object ? UnwrappedObject<T> : T;

// Extract all known symbols from an object
// when unwrapping Object the symbols are not `in keyof`, this should cover all the
// known symbols
type SymbolExtract<T> = (T extends { [Symbol.asyncIterator]: infer V } ? { [Symbol.asyncIterator]: V } : {}) &
  (T extends { [Symbol.hasInstance]: infer V } ? { [Symbol.hasInstance]: V } : {}) &
  (T extends { [Symbol.isConcatSpreadable]: infer V } ? { [Symbol.isConcatSpreadable]: V } : {}) &
  (T extends { [Symbol.iterator]: infer V } ? { [Symbol.iterator]: V } : {}) &
  (T extends { [Symbol.match]: infer V } ? { [Symbol.match]: V } : {}) &
  (T extends { [Symbol.matchAll]: infer V } ? { [Symbol.matchAll]: V } : {}) &
  (T extends { [Symbol.replace]: infer V } ? { [Symbol.replace]: V } : {}) &
  (T extends { [Symbol.search]: infer V } ? { [Symbol.search]: V } : {}) &
  (T extends { [Symbol.species]: infer V } ? { [Symbol.species]: V } : {}) &
  (T extends { [Symbol.split]: infer V } ? { [Symbol.split]: V } : {}) &
  (T extends { [Symbol.toPrimitive]: infer V } ? { [Symbol.toPrimitive]: V } : {}) &
  (T extends { [Symbol.toStringTag]: infer V } ? { [Symbol.toStringTag]: V } : {}) &
  (T extends { [Symbol.unscopables]: infer V } ? { [Symbol.unscopables]: V } : {});

type UnwrappedObject<T> = { [P in keyof T]: UnwrapRef<T[P]> } & SymbolExtract<T>;
