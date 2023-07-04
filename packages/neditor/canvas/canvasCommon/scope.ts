import { tail } from "../../base/common/array";
import { Optional } from "../../base/common/typescript";

export class Scope {
  private static instances = new Map<symbol, Scope>();
  static fromFullPath(path: string[]) {
    const key = Symbol.for(`${path.join('/')}`);
    if (!this.instances.has(key)) {
      this.instances.set(key, new Scope(key));
    }
    return this.instances.get(key)!;
  }

  protected constructor(private symbol: symbol) {
    Object.freeze(this);
  }

  createChild(id: string) {
    const key = Symbol.keyFor(this.symbol)!;
    return Scope.fromFullPath(key.split('/').concat(id));
  }

  get key() {
    return Symbol.keyFor(this.symbol)!;
  }

  get name(): string {
    return tail(this.key.split('/'));
  }

  get parent(): Optional<Scope> {
    const path = this.key.split('/');
    if (path.length === 1) return undefined;
    path.pop();
    return Scope.fromFullPath(path);
  }

  get path() {
    return this.key.split('/');
  }

  EQ(other: Scope) {
    return this.symbol === other.symbol;
  }

  NE(other: Scope) {
    return this.symbol !== other.symbol;
  }

  *[Symbol.iterator](): Iterator<Scope> {
    const path = this.path;
    for (let i = 0, len = path.length; i < len; i++) {
      yield Scope.fromFullPath(path.slice(0, i + 1));
    }
  }
}

export const RootScope = Scope.fromFullPath(['']);

export class ScopedIdentifier {
  static scoped = new WeakMap<Scope, Map<string, ScopedIdentifier>>();
  static create(id: string, scope: Scope) {
    let map = this.scoped.get(scope);
    if (!map) {
      map = new Map<string, ScopedIdentifier>();
      this.scoped.set(scope, map);
    }
    if (!map.has(id)) {
      map.set(id, new ScopedIdentifier(id, scope));
    }
    return map.get(id)!;
  }

  private constructor(public id: string, public scope: Scope) {
    Object.freeze(this);
  }

  EQ(other: ScopedIdentifier) {
    return this.id === other.id && this.scope.EQ(other.scope);
  }

  NE(other: ScopedIdentifier) {
    return !this.EQ(other);
  }
}
