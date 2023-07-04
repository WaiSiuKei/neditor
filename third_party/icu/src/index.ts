import icuFactory, {
  ICUModule,
  TLocale as TLocale,
  TBreakIterator,
  TUnicodeString, TStringPiece, UBiDiPtr
} from './icu-binding';
// @ts-ignore
import wasmURL from './icu-binding.wasm?url';
import { UErrorCode } from "./icu-c";

import { IReference } from "@neditor/core/base/common/lifecycle";
import { AccessorCallback } from "@neditor/core/base/common/typescript";

export let Locale: ICUModule["Locale"]
export type Locale = TLocale

export let BreakIterator: ICUModule["BreakIterator"]
export type BreakIterator = TBreakIterator

export let UnicodeString: ICUModule["UnicodeString"]
export type UnicodeString = TUnicodeString

export let StringPiece: ICUModule["StringPiece"]
export type StringPiece = TStringPiece

export let init_icu: ICUModule['init_icu']
export let ubidi_openSized: ICUModule['ubidi_openSized']
export let ubidi_close: ICUModule['ubidi_close']
export let ubidi_setPara: ICUModule['ubidi_setPara']
export let ubidi_countRuns: ICUModule['ubidi_countRuns']
export let ubidi_getLogicalRun: ICUModule['ubidi_getLogicalRun']
export let allocStr: (str: string, dontAddNull?: boolean) => IReference<{ ptr: number, view: number[] }>
export let _free: ICUModule["_free"]
export let _malloc: ICUModule["_malloc"]
export let getValue: ICUModule["getValue"]

export async function initICUModule() {
  const module = await icuFactory({
    async instantiateWasm(info: any, receiveInstance: any) {
      const m = await WebAssembly.instantiateStreaming(fetch(wasmURL, { credentials: 'same-origin' }), info);
      return receiveInstance(m.instance);
    }
  } as any);

  let ret = await module.ready as ICUModule;

  // allocate: typeof allocate;
  // intArrayFromString: typeof intArrayFromString;

  Locale = ret.Locale
  BreakIterator = ret.BreakIterator
  UnicodeString = ret.UnicodeString
  StringPiece = ret.StringPiece
  init_icu = ret.init_icu
  ubidi_openSized = ret.ubidi_openSized
  ubidi_close = ret.ubidi_close
  ubidi_setPara = ret.ubidi_setPara
  ubidi_countRuns = ret.ubidi_countRuns
  ubidi_getLogicalRun = ret.ubidi_getLogicalRun

  // https://stackoverflow.com/a/46855162
  allocStr = (str, dontAddNull = false) => {
    // const encoder = new TextEncoder();
    // const view = encoder.encode(str);
    const view = ret.intArrayFromString(str, dontAddNull);
    // const ptr = wasmInstance.allocate(view, 'i8', 0);
    const ptr = ret.allocateUTF8(str);
    return {
      object: {
        ptr,
        view
      },
      dispose() {
        ret._free(ptr)
      }
    };
  }

  _free = ret._free
  _malloc = ret._malloc
  getValue = ret.getValue
  return ret;
}

export function U_FAILURE(x: number | UErrorCode) {
  return x > UErrorCode.U_ZERO_ERROR;
}

export function U_SUCCESS(x: number | UErrorCode) {
  return x <= UErrorCode.U_ZERO_ERROR;
}

export { UCharDirection, UErrorCode } from './icu-c'
export type { UBiDiPtr, UBiDiLevel } from './icu-binding'

export function scoped_ubidi_openSized<R>(maxLength: number, maxRunCount: number) {
  return (cb: AccessorCallback<UBiDiPtr, R>) => {
    const ubidi = ubidi_openSized(maxLength, maxRunCount)
    try {
      return cb(ubidi)
    } finally {
      ubidi_close(ubidi)
    }
  }
}
