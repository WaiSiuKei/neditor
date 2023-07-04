/**
 * Takes a sorted array and a function p. The array is sorted in such a way that all elements where p(x) is false
 * are located before all elements where p(x) is true.
 * @returns the least x for which p(x) is true or array.length if no element fullfills the given function.
 */
export function findFirstIndex<T>(array: ReadonlyArray<T>, p: (x: T) => boolean): number {
  let len = array.length;
  if (len === 0) {
    return -1; // no children
  }
  for (let i = 0; i < len; i++) {
    if (p(array[i])) return i;
  }
  return -1;
}

export function findFirstItem<T>(array: ReadonlyArray<T>, p: (x: T) => boolean): T | undefined {
  const idx = findFirstIndex(array, p);
  if (idx === -1) return undefined;
  return array[idx];
}

export function findLastIndex<T>(array: ReadonlyArray<T>, p: (x: T) => boolean): number {
  let len = array.length;
  if (len === 0) {
    return -1; // no children
  }
  for (let i = len - 1; i > -1; i--) {
    if (p(array[i])) return i;
  }
  return -1;
}

export function findLastItem<T>(array: ReadonlyArray<T>, p: (x: T) => boolean): T | undefined {
  const idx = findLastIndex(array, p);
  if (idx === -1) return undefined;
  return array[idx];
}

/**
 * @returns New array with all falsy values removed. The original array IS NOT modified.
 */
export function coalesce<T>(array: ReadonlyArray<T | undefined | null>): T[] {
  return <T[]>array.filter(e => !!e);
}

/**
 * Removes duplicates from the given array. The optional keyFn allows to specify
 * how elements are checked for equalness by returning a unique string for each.
 */
export function distinct<T>(array: ReadonlyArray<T>, keyFn?: (t: T) => string): T[] {
  if (!keyFn) {
    return array.filter((element, position) => {
      return array.indexOf(element) === position;
    });
  }

  const seen: { [key: string]: boolean; } = Object.create(null);
  return array.filter((elem) => {
    const key = keyFn(elem);
    if (seen[key]) {
      return false;
    }

    seen[key] = true;

    return true;
  });
}

export function equals<T>(one: ReadonlyArray<T> | undefined, other: ReadonlyArray<T> | undefined, itemEquals: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
  if (one === other) {
    return true;
  }

  if (!one || !other) {
    return false;
  }

  if (one.length !== other.length) {
    return false;
  }

  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }

  return true;
}

export function tail<T>(array: ArrayLike<T>, n: number = 0): T {
  return array[array.length - (1 + n)];
}

export function peekFirst<T>(array: ArrayLike<T>) {
  return array[0]
}

export function peekLast<T>(array: ArrayLike<T>) {
  return tail(array)
}

/**
 * Inserts an element into an array. Returns a function which, when
 * called, will remove that element from the array.
 *
 * @deprecated In almost all cases, use a `Set<T>` instead.
 */
export function insert<T>(array: T[], element: T): () => void {
  array.push(element);

  return () => remove(array, element);
}

/**
 * Removes an element from an array if it can be found.
 *
 * @deprecated In almost all cases, use a `Set<T>` instead.
 */
export function remove<T>(array: T[], element: T): T | undefined {
  const index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);

    return element;
  }

  return undefined;
}

export function isArrayShallowEqual<T>(
  a1: ReadonlyArray<T> | undefined,
  a2: ReadonlyArray<T> | undefined,
): boolean {
  return equals(a1, a2, (a: T, b: T) => a === b);
}
