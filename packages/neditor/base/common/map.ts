import { CharCode } from "./charCode";
import { compareSubstring, compareSubstringIgnoreCase } from "./strings";

class TernarySearchTreeNode<K, V> {
  segment!: string;
  value: V | undefined;
  key!: K;
  left: TernarySearchTreeNode<K, V> | undefined;
  mid: TernarySearchTreeNode<K, V> | undefined;
  right: TernarySearchTreeNode<K, V> | undefined;

  isEmpty(): boolean {
    return !this.left && !this.mid && !this.right && !this.value;
  }
}


export interface IKeyIterator<K> {
  reset(key: K): this;
  next(): this;

  hasNext(): boolean;
  cmp(a: string): number;
  value(): string;
}

export class ConfigKeysIterator implements IKeyIterator<string> {

  private _value!: string;
  private _from!: number;
  private _to!: number;

  constructor(
    private readonly _caseSensitive: boolean = true
  ) { }

  reset(key: string): this {
    this._value = key;
    this._from = 0;
    this._to = 0;
    return this.next();
  }

  hasNext(): boolean {
    return this._to < this._value.length;
  }

  next(): this {
    // this._data = key.split(/[\\/]/).filter(s => !!s);
    this._from = this._to;
    let justSeps = true;
    for (; this._to < this._value.length; this._to++) {
      const ch = this._value.charCodeAt(this._to);
      if (ch === CharCode.Period) {
        if (justSeps) {
          this._from++;
        } else {
          break;
        }
      } else {
        justSeps = false;
      }
    }
    return this;
  }

  cmp(a: string): number {
    return this._caseSensitive
      ? compareSubstring(a, this._value, 0, a.length, this._from, this._to)
      : compareSubstringIgnoreCase(a, this._value, 0, a.length, this._from, this._to);
  }

  value(): string {
    return this._value.substring(this._from, this._to);
  }
}

export class TernarySearchTree<K, V> {
  // static forUris<E>(ignorePathCasing: (key: URI) => boolean = () => false): TernarySearchTree<URI, E> {
  //   return new TernarySearchTree<URI, E>(new UriIterator(ignorePathCasing));
  // }
  //
  // static forPaths<E>(ignorePathCasing = false): TernarySearchTree<string, E> {
  //   return new TernarySearchTree<string, E>(new PathIterator(undefined, !ignorePathCasing));
  // }
  //
  // static forStrings<E>(): TernarySearchTree<string, E> {
  //   return new TernarySearchTree<string, E>(new StringIterator());
  // }

  static forConfigKeys<E>(): TernarySearchTree<string, E> {
    return new TernarySearchTree<string, E>(new ConfigKeysIterator());
  }

  private _iter: IKeyIterator<K>;
  private _root: TernarySearchTreeNode<K, V> | undefined;

  constructor(segments: IKeyIterator<K>) {
    this._iter = segments;
  }

  clear(): void {
    this._root = undefined;
  }

  set(key: K, element: V): V | undefined {
    const iter = this._iter.reset(key);
    let node: TernarySearchTreeNode<K, V>;

    if (!this._root) {
      this._root = new TernarySearchTreeNode<K, V>();
      this._root.segment = iter.value();
    }

    node = this._root;
    while (true) {
      const val = iter.cmp(node.segment);
      if (val > 0) {
        // left
        if (!node.left) {
          node.left = new TernarySearchTreeNode<K, V>();
          node.left.segment = iter.value();
        }
        node = node.left;

      } else if (val < 0) {
        // right
        if (!node.right) {
          node.right = new TernarySearchTreeNode<K, V>();
          node.right.segment = iter.value();
        }
        node = node.right;

      } else if (iter.hasNext()) {
        // mid
        iter.next();
        if (!node.mid) {
          node.mid = new TernarySearchTreeNode<K, V>();
          node.mid.segment = iter.value();
        }
        node = node.mid;
      } else {
        break;
      }
    }
    const oldElement = node.value;
    node.value = element;
    node.key = key;
    return oldElement;
  }

  get(key: K): V | undefined {
    return this._getNode(key)?.value;
  }

  private _getNode(key: K) {
    const iter = this._iter.reset(key);
    let node = this._root;
    while (node) {
      const val = iter.cmp(node.segment);
      if (val > 0) {
        // left
        node = node.left;
      } else if (val < 0) {
        // right
        node = node.right;
      } else if (iter.hasNext()) {
        // mid
        iter.next();
        node = node.mid;
      } else {
        break;
      }
    }
    return node;
  }

  has(key: K): boolean {
    const node = this._getNode(key);
    return !(node?.value === undefined && node?.mid === undefined);
  }

  delete(key: K): void {
    return this._delete(key, false);
  }

  deleteSuperstr(key: K): void {
    return this._delete(key, true);
  }

  private _delete(key: K, superStr: boolean): void {
    const iter = this._iter.reset(key);
    const stack: [-1 | 0 | 1, TernarySearchTreeNode<K, V>][] = [];
    let node = this._root;

    // find and unset node
    while (node) {
      const val = iter.cmp(node.segment);
      if (val > 0) {
        // left
        stack.push([1, node]);
        node = node.left;
      } else if (val < 0) {
        // right
        stack.push([-1, node]);
        node = node.right;
      } else if (iter.hasNext()) {
        // mid
        iter.next();
        stack.push([0, node]);
        node = node.mid;
      } else {
        if (superStr) {
          // remove children
          node.left = undefined;
          node.mid = undefined;
          node.right = undefined;
        } else {
          // remove element
          node.value = undefined;
        }

        // clean up empty nodes
        while (stack.length > 0 && node.isEmpty()) {
          let [dir, parent] = stack.pop()!;
          switch (dir) {
            case 1:
              parent.left = undefined;
              break;
            case 0:
              parent.mid = undefined;
              break;
            case -1:
              parent.right = undefined;
              break;
          }
          node = parent;
        }
        break;
      }
    }
  }

  findSubstr(key: K): V | undefined {
    const iter = this._iter.reset(key);
    let node = this._root;
    let candidate: V | undefined = undefined;
    while (node) {
      const val = iter.cmp(node.segment);
      if (val > 0) {
        // left
        node = node.left;
      } else if (val < 0) {
        // right
        node = node.right;
      } else if (iter.hasNext()) {
        // mid
        iter.next();
        candidate = node.value || candidate;
        node = node.mid;
      } else {
        break;
      }
    }
    return node && node.value || candidate;
  }

  findSuperstr(key: K): IterableIterator<[K, V]> | undefined {
    const iter = this._iter.reset(key);
    let node = this._root;
    while (node) {
      const val = iter.cmp(node.segment);
      if (val > 0) {
        // left
        node = node.left;
      } else if (val < 0) {
        // right
        node = node.right;
      } else if (iter.hasNext()) {
        // mid
        iter.next();
        node = node.mid;
      } else {
        // collect
        if (!node.mid) {
          return undefined;
        } else {
          return this._entries(node.mid);
        }
      }
    }
    return undefined;
  }

  forEach(callback: (value: V, index: K) => any): void {
    for (const [key, value] of this) {
      callback(value, key);
    }
  }

  * [Symbol.iterator](): IterableIterator<[K, V]> {
    yield* this._entries(this._root);
  }

  private* _entries(node: TernarySearchTreeNode<K, V> | undefined): IterableIterator<[K, V]> {
    if (node) {
      // left
      yield* this._entries(node.left);

      // node
      if (node.value) {
        // callback(node.value, this._iter.join(parts));
        yield [node.key, node.value];
      }
      // mid
      yield* this._entries(node.mid);

      // right
      yield* this._entries(node.right);
    }
  }
}
