import { DLOG, WARNING } from '@neditor/core/base/logging';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { createDecorator } from '../../instantiation/common/instantiation';

export const IGenericRegistry = createDecorator<IGenericRegistry<any>>('IGenericRegistry');

export interface IGenericRegistry<T extends { id: string }> {
  _serviceBrand: undefined;

  add(item: T): void;
  remove(id: string): void;
  has(id: string): boolean;
  value(id: string): T | undefined;
  addAlias(alias: string, id: string): void;
  removeAlias(alias: string): void;
  values(): T[];
}

export class GenericRegistry<T extends { id: string }> implements IGenericRegistry<T> {
  declare _serviceBrand: undefined;
  map = new Map<string, T>();
  aliases = new Map<string, string>();
  add(item: T) {
    const id = item.id;
    const exists = this.map.has(id);
    if (exists) {
      DLOG(WARNING, 'DUPLICATED');
      NOTIMPLEMENTED();
    }
    this.map.set(id, item);
  }

  // get(id: string) {
  //   return this.map.get(id)
  // }

  remove(id: string) {
    this.map.delete(id);
  }

  has(id: string) {
    let result = this.map.has(id);
    if (!result) {
      let aliased = this.aliases.get(id);
      result = !!aliased && this.map.has(aliased);
    }
    return result;
  }

  value(id: string) {
    let result = this.map.get(id);
    if (!result) {
      let aliased = this.aliases.get(id);
      if (aliased) {
        result = this.map.get(aliased);
      }
    }
    return result;
  }

  addAlias(alias: string, id: string) {
    if (this.map.has(alias)) {
      NOTIMPLEMENTED();
    }
    this.aliases.set(alias, id);
  }

  removeAlias(alias: string) {
    this.aliases.delete(alias);
  }
  values(): T[] {
    return Array.from(this.map.values());
  }
}
