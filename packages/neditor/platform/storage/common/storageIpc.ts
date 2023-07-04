/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Emitter, Event } from '@neditor/core/base/common/event';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import {
  IStorageDatabase,
  IStorageItemsChangeEvent,
  IUpdateRequest,
} from '@neditor/core/base/parts/storage/common/storage';

export type Key = string;
export type Value = string;
export type Item = [Key, Value];

export interface IBaseSerializableStorageRequest {
  readonly workspace: undefined;
}

export interface ISerializableUpdateRequest extends IBaseSerializableStorageRequest {
  insert?: Item[];
  delete?: Key[];
}



