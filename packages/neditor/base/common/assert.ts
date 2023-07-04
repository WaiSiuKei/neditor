/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

/**
 * Throws an error with the provided message if the provided value does not evaluate to a true Javascript value.
 */
export function ok(value?: unknown, message?: string) {
  if (!value) {
    throw new Error(message ? `Assertion failed (${message})` : 'Assertion Failed');
  }
}

/**
 * 断言测试一个值是否为 true
 * @param {...any} args
 * @param message error message
 */
function assert(value: unknown, message?: string | Error): asserts value {
  if (!value) {
    throw message instanceof Error ? message : new Error(message);
  }
}

/**
 * 类似 assert, 但是 console.error(error) 而不是 throw error
 * @param value
 * @param message
 */
function should(value: unknown, message?: string | Error): asserts value {
  const error = message instanceof Error ? message : new Error(message);
  if (!value) {
    console.error(error);
  }
}

export { assert, should };
