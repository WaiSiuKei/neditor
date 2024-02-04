import { isReactive, reactiveMap, Target, toRaw } from './reactive';
import { TriggerOpTypes } from './operations';
import { isArray, isObject, isSymbol, toRawType } from '@vue/shared';

interface IParentContext {
  parent: object;
  key: string;
}

const parentMap = new WeakMap<Target, IParentContext>();

const REPLACE = 'replace';
const ADD = 'add';
const REMOVE = 'remove';

const enum EditingMode {
  none,
  update,
  undoRedo,
}

export interface Patch {
  op: 'replace' | 'remove' | 'add';
  path: (string | number)[];
  root: object;
  newValue?: any;
  oldValue?: any;
}

const patches: Patch[] = [];
export function trackMutation(target: object,
                              type: TriggerOpTypes,
                              key: string | symbol | number,
                              newValue: unknown,
                              oldValue?: unknown) {
  if (editingMode !== EditingMode.update) return;
  if (isSymbol(key)) throw new Error('500');
  let patch: Patch;
  if (!isReactive(target)) {
    const proxyObj = reactiveMap.get(target);
    if (!proxyObj) {
      throw new Error('500');
    }
    target = proxyObj;
  }
  const p = getPath(target);
  const [root, path] = p;
  path.push(key);
  newValue = deepClone(newValue);
  oldValue = deepClone(oldValue);
  if (type === TriggerOpTypes.SET) {
    patch = {
      op: REPLACE,
      path,
      root,
      newValue,
      oldValue,
    };
  } else if (type === TriggerOpTypes.ADD) {
    patch = {
      op: ADD,
      path,
      root,
      newValue,
      oldValue,
    };
  } else if (type === TriggerOpTypes.CLEAR) {
    throw new Error('500');
  } else if (type === TriggerOpTypes.DELETE) {
    patch = {
      op: REMOVE,
      path,
      root,
      newValue,
      oldValue,
    };
  } else {
    throw new Error('500');
  }
  patches.push(patch);
}

export function trackParentChain(target: object,
                                 key: string,
                                 parent: object) {
  if (editingMode !== EditingMode.update) return;
  parentMap.set(target, { key, parent });
}

function getPath(target: object): [object, Array<string | number>] {
  const pathParts: string[] = [];
  while (target) {
    const ctx = parentMap.get(target);
    if (!ctx) break;
    const { key, parent } = ctx;
    pathParts.unshift(key);
    target = parent;
  }
  return [target, pathParts];
}

let editingMode = EditingMode.none;
export function produce(cb: Function): Patch[] {
  editingMode = EditingMode.update;
  cb();
  editingMode = EditingMode.none;
  const ret = patches.slice();
  patches.length = 0;
  return ret;
}

export function isMutating(): boolean {
  return editingMode !== EditingMode.none;
}

export function redoPatches(target: object,
                            patches: Patch[]): void {
  editingMode = EditingMode.undoRedo;
  patches.forEach(patch => {
    const { path, op, newValue, root } = patch;

    let base = target;
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i];
      // avoid prototype pollution
      if ((isObject(base) || isArray) && (p === '__proto__' || p === 'constructor')) throw new Error('500');
      if (typeof base === 'function' && p === 'prototype') {
        throw new Error('500');
      }
      base = Reflect.get(base, p);
      if (typeof base !== 'object') {
        throw new Error('500');
      }
    }

    const key = path[path.length - 1];
    switch (op) {
      case REPLACE:
      case ADD:
        return Reflect.set(base, key, newValue);
      case REMOVE:
        if (isArray(base)) {
          base.splice(parseInt(key.toString(), 10), 1);
          return true;
        } else {
          return Reflect.deleteProperty(base, key);
        }
      default:
        throw new Error('500');
    }
  });
  editingMode = EditingMode.none;
}

export function undoPathes(target: object,
                           patches: Patch[]): void {
  const inverted = patches.reverse().map(p => invert(p));
  redoPatches(target, inverted);
}

export function invert(patch: Patch): Patch {
  const { op, newValue, oldValue } = patch;
  switch (op) {
    case REPLACE:
      return {
        ...patch,
        newValue: oldValue,
        oldValue: newValue,
      };
    case ADD:
      return {
        ...patch,
        op: REMOVE,
        oldValue: newValue,
        newValue: oldValue,
      };
    case REMOVE:
      return {
        ...patch,
        op: ADD,
        oldValue: newValue,
        newValue: oldValue,
      };
    default:
      throw new Error('500');
  }
}

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof RegExp) {
    // See https://github.com/microsoft/TypeScript/issues/10990
    return obj as any;
  }
  const result: any = isArray(obj) ? [] : {};
  Object.keys(<any>obj).forEach((key: string) => {
    if ((<any>obj)[key] && typeof (<any>obj)[key] === 'object') {
      result[key] = deepClone((<any>obj)[key]);
    } else {
      result[key] = (<any>obj)[key];
    }
  });
  return result;
}
