import icuFactory from './icu-binding';

// @ts-ignore
import wasmURL from './icu-binding.wasm?url';

const module = await icuFactory({
    async instantiateWasm(info: any, receiveInstance: any) {
        const m = await WebAssembly.instantiateStreaming(fetch(wasmURL, {credentials: 'same-origin'}), info)
        return receiveInstance(m.instance)
    }
} as any);

const instance = await module.ready;
// const initResult = instance.init_icu();
// console.log('instance.init_icu()', initResult);
//
// const lan = navigator.language;
// console.log('lan', lan);
//
// const { ptr: inputPtr, view: inputView } = allocStr('abc', instance, true);
// const stringPiece = new instance.StringPiece(inputPtr, inputView.length);
// console.log(stringPiece);
// const str = instance.UnicodeString.fromUTF8(stringPiece);
// console.log('UnicodeString', str);
// console.log(1, str.charAt(0))
// console.log(2, str.charAt(1))
// console.log(3, str.charAt(2))
//
// console.log(str.length());
// let c = '中';
// str.appendChar16(c.charCodeAt(0));
// console.log(str.length());
// console.log(str.getBuffer());
//
// const { ptr: localePtr } = allocStr(lan, instance);
// const locale = instance.Locale.createCanonical(localePtr);
// console.log('Locale', locale);
// console.log(locale.getLanguage());
//
// const breakIterator = instance.createBreakIterator(BreakType.SENTENCE, locale);
// console.log('BreakIterator', breakIterator);
// breakIterator.setText(str);
//
// let end: number;
// let start = breakIterator.first();
// let n = 0;
// for (end = breakIterator.next(); end != BreakIteratorDone; start = end, end = breakIterator.next()) {
//     console.log(start, end, breakIterator.getRuleStatus());
// }
