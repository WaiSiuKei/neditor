import { isFunction } from './type';

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof RegExp) {
    // See https://github.com/microsoft/TypeScript/issues/10990
    return obj as any;
  }
  if (obj instanceof Map) {
    let ret: Map<any, any> = new Map();
    for (let [k, v] of obj as Map<any, any>) {
      ret.set(k, deepClone(v));
    }
    return ret as unknown as T;
  }
  let cloneFunc = Reflect.get(obj as any, 'CLONE');
  if (isFunction(cloneFunc)) {
    return cloneFunc.call(obj);
  }
  const result: any = Array.isArray(obj) ? [] : {};
  Object.keys(<any>obj).forEach((key: string) => {
    if ((<any>obj)[key] && typeof (<any>obj)[key] === 'object') {
      result[key] = deepClone((<any>obj)[key]);
    } else {
      result[key] = (<any>obj)[key];
    }
  });
  return result;
}

export function equals(one: any, other: any): boolean {
  if (one === other) {
    return true;
  }
  if (one === null || one === undefined || other === null || other === undefined) {
    return false;
  }
  if (typeof one !== typeof other) {
    return false;
  }
  if (typeof one !== 'object') {
    return false;
  }
  if ((Array.isArray(one)) !== (Array.isArray(other))) {
    return false;
  }

  let i: number;
  let key: string;

  if (Array.isArray(one)) {
    if (one.length !== other.length) {
      return false;
    }
    for (i = 0; i < one.length; i++) {
      if (!equals(one[i], other[i])) {
        return false;
      }
    }
  } else {
    const oneKeys: string[] = [];

    for (key in one) {
      oneKeys.push(key);
    }
    oneKeys.sort();
    const otherKeys: string[] = [];
    for (key in other) {
      otherKeys.push(key);
    }
    otherKeys.sort();
    if (!equals(oneKeys, otherKeys)) {
      return false;
    }
    for (i = 0; i < oneKeys.length; i++) {
      if (!equals(one[oneKeys[i]], other[oneKeys[i]])) {
        return false;
      }
    }
  }
  return true;
}

export function keys<T extends object>(o: T): Array<keyof T> {
  return Object.keys(o) as unknown as Array<keyof T>;
}

const _hasOwnProperty = Object.prototype.hasOwnProperty;

export function deepFreeze<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  const stack: any[] = [obj];
  while (stack.length > 0) {
    const obj = stack.shift();
    Object.freeze(obj);
    for (const key in obj) {
      if (_hasOwnProperty.call(obj, key)) {
        const prop = obj[key];
        if (typeof prop === 'object' && !Object.isFrozen(prop)) {
          stack.push(prop);
        }
      }
    }
  }
  return obj;
}


type obj = { [key: string]: any };

/**
 * Returns an object that has keys for each value that is different in the base object. Keys
 * that do not exist in the target but in the base object are not considered.
 *
 * Note: This is not a deep-diffing method, so the values are strictly taken into the resulting
 * object if they differ.
 *
 * @param base the object to diff against
 * @param obj the object to use for diffing
 */
export function distinct(base: obj, target: obj): obj {
  const result = Object.create(null);

  if (!base || !target) {
    return result;
  }

  const targetKeys = Object.keys(target);
  targetKeys.forEach((k) => {
    const baseValue = base[k];
    const targetValue = target[k];

    if (!equals(baseValue, targetValue)) {
      result[k] = targetValue;
    }
  });

  return result;
}
