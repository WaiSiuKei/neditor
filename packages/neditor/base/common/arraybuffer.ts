export function memcmpWithNums(lhs: Uint8Array, rhs: number[], offset: number = 0): boolean {
  for (let i = 0; i < rhs.length; i++) {
    if (lhs[i + offset] != rhs[i]) return false;
  }
  return true;
}

export function memcmpWithString(lhs: Uint8Array, rhs: string, offset: number = 0): boolean {
  return memcmpWithNums(lhs, rhs.split('').map(s => s.charCodeAt(0), offset));
}

export function memcpy(dest: Uint8Array, src: Uint8Array, start: number, length: number) {
  for (let i = 0; i < length; i++) {
    dest[i + start] = src[i];
  }
}

export function uint8ArrayToBuffer(array: Uint8Array): ArrayBuffer {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
}

export function typedArrayToBuffer(array: Uint8Array): ArrayBuffer {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
