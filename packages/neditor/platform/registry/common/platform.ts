/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import * as Assert from '@neditor/core/base/common/assert';
import * as Types from '@neditor/core/base/common/type';
import { globals } from '@neditor/core/base/common/platform';

export interface IRegistry {
  /**
   * Adds the extension functions and properties defined by data to the
   * platform. The provided id must be unique.
   * @param id a unique identifier
   * @param data a contribution
   */
  add(id: string, data: any): void;

  /**
   * Returns true iff there is an extension with the provided id.
   * @param id an extension identifier
   */
  knows(id: string): boolean;

  /**
   * Returns the extension functions and properties defined by the specified key or null.
   * @param id an extension identifier
   */
  as<T>(id: string): T;
}

class RegistryImpl implements IRegistry {
  private readonly data = new Map<string, any>();

  public add(id: string, data: any): void {
    Assert.ok(Types.isString(id));
    Assert.ok(Types.isObject(data));
    if (this.data.has(id)) return;
    // Assert.ok(!this.data.has(id), 'There is already an extension with this id');

    this.data.set(id, data);
  }

  public knows(id: string): boolean {
    return this.data.has(id);
  }

  public as(id: string): any {
    return this.data.get(id) || null;
  }
}

const key = 'Registry';
let instance: IRegistry;
if (Reflect.has(globals, key)) {
  instance = Reflect.get(globals, key);
} else {
  instance = new RegistryImpl();
  Reflect.set(globals, key, instance);
}
export const Registry: IRegistry = instance;
