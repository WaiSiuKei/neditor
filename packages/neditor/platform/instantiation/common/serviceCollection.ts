/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { SyncDescriptor } from './descriptors';
import { ServiceIdentifier, IInstantiationService } from './instantiation';
import { IDisposable } from '@neditor/core/base/common/lifecycle';
import { isFunction } from '@neditor/core/base/common/type';

export class ServiceCollection implements IDisposable {
  private _entries = new Map<ServiceIdentifier<any>, any>();

  constructor(...entries: [ServiceIdentifier<any>, any][]) {
    for (const [id, service] of entries) {
      this.set(id, service);
    }
  }

  set<T>(
    id: ServiceIdentifier<T>,
    instanceOrDescriptor: T | SyncDescriptor<T>,
  ): T | SyncDescriptor<T> {
    const result = this._entries.get(id);
    this._entries.set(id, instanceOrDescriptor);
    return result;
  }

  has(id: ServiceIdentifier<any>): boolean {
    return this._entries.has(id);
  }

  get<T>(id: ServiceIdentifier<T>): T | SyncDescriptor<T> {
    return this._entries.get(id);
  }

  dispose() {
    for (const [key, value] of this._entries) {
      if (key !== IInstantiationService) {
        if (!(value instanceof SyncDescriptor)) {
          const disposeFunc = Reflect.get(value, 'dispose');
          if (isFunction(disposeFunc)) {
            disposeFunc.call(value);
          }
        }
      }
      this._entries.delete(key);
    }
  }
}
