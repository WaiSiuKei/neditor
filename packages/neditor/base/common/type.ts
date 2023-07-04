export function isUndefined(obj: unknown): obj is undefined {
  return (typeof obj === 'undefined');
}

export function isNil(obj: unknown): obj is undefined | null {
  return (isUndefined(obj) || obj === null);
}

export const isFalse = (val: unknown): val is false => val === false;
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNumber = (val: unknown): val is number => typeof val === 'number';
export const isFunction = (val: unknown): val is Function => typeof val === 'function';
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol';
export const isArray = Array.isArray;

export function isThenable<T>(obj: unknown): obj is Promise<T> {
  return !!obj && typeof (obj as unknown as Promise<T>).then === 'function';
}

/**
 * @returns whether the provided parameter is undefined or null.
 */
export function isUndefinedOrNull(obj: unknown): obj is undefined | null {
  return (isUndefined(obj) || obj === null);
}

/**
 * Asserts that the argument passed in is neither undefined nor null.
 */
export function assertIsDefined<T>(arg: T | null | undefined): T {
  if (isUndefinedOrNull(arg)) {
    throw new Error('Assertion Failed: argument is undefined or null');
  }

  return arg;
}

export function assertValue(value: unknown): asserts value {
  if (isUndefinedOrNull(value)) {
    throw new Error('Assertion Failed: argument is undefined or null');
  }
}

export function assertIsError(error: unknown): asserts error is Error {
  // if you have nodejs assert:
  // assert(error instanceof Error);
  // otherwise
  if (!(error instanceof Error)) {
    throw error;
  }
}

export type TypeConstraint = string | Function;

export function validateConstraints(args: unknown[], constraints: Array<TypeConstraint | undefined>): void {
  const len = Math.min(args.length, constraints.length);
  for (let i = 0; i < len; i++) {
    validateConstraint(args[i], constraints[i]);
  }
}

export function validateConstraint(arg: unknown, constraint: TypeConstraint | undefined): void {

  if (isString(constraint)) {
    if (typeof arg !== constraint) {
      throw new Error(`argument does not match constraint: typeof ${constraint}`);
    }
  } else if (isFunction(constraint)) {
    try {
      if (arg instanceof constraint) {
        return;
      }
    } catch {
      // ignore
    }
    if (!isUndefinedOrNull(arg) && (arg as any).constructor === constraint) {
      return;
    }
    if (constraint.length === 1 && constraint.call(undefined, arg) === true) {
      return;
    }
    throw new Error(`argument does not match one of these constraints: arg instanceof constraint, arg.constructor === constraint, nor constraint(arg) === true`);
  }
}

/**
 * Converts null to undefined, passes all other values through.
 */
export function withNullAsUndefined<T>(x: T | null): T | undefined {
  return x === null ? undefined : x;
}

/**
 * Converts undefined to null, passes all other values through.
 */
export function withUndefinedAsNull<T>(x: T | undefined): T | null {
  return typeof x === 'undefined' ? null : x;
}
