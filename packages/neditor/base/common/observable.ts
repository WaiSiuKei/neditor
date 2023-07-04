/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type {
  IObservable,
  IObserver,
  IReader,
  ISettable,
  ISettableObservable,
  ITransaction,
} from './observableImpl/base';
export {
  observableValue,
  transaction,
} from './observableImpl/base';
export { derived } from './observableImpl/derived';
export {
  autorun,
  autorunDelta,
  autorunHandleChanges,
  autorunWithStore,
} from './observableImpl/autorun';
export * from './observableImpl/utils';

import { ConsoleObservableLogger, setLogger } from './observableImpl/logging';

const enableLogging = false;
if (enableLogging) {
  setLogger(new ConsoleObservableLogger());
}
