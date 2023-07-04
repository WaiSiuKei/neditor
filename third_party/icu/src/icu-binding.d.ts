import { UBiDiLevel, UBiDiPtr, UErrorCode } from './icu-c';
import { Locale } from './index';

type Ptr = number;
type Char16Ptr = number
type ConstructorTypeOf<T> = new (...args: any[]) => T;

declare class CClass {
  delete(): void
}

export interface ICUModule extends RecentEmscriptenModule {
  allocate: typeof allocate;
  intArrayFromString: typeof intArrayFromString;

  init_icu(): UErrorCode;

  Locale: ConstructorTypeOf<TLocale> & LocaleStatic;
  BreakIterator: ConstructorTypeOf<TBreakIterator> & BreakIteratorStatic;
  UnicodeString: UnicodeStringConstructor & ConstructorTypeOf<TUnicodeString> & UnicodeStringStatic;
  StringPiece: StringPieceConstructor;

  ubidi_openSized(maxLength: number, maxRunCount: number): UBiDiPtr;
  ubidi_close(ubidiPtr: UBiDiPtr): void;
  ubidi_setPara(ubidiPtr: UBiDiPtr, str: TUnicodeString, paraLevel: UBiDiLevel): UErrorCode;
  ubidi_countRuns(ubidiPtr: UBiDiPtr): number;
  ubidi_getLogicalRun(ubidiPtr: UBiDiPtr, logicalPosition: number, logicalLimit_ptr: Ptr, level_ptr: Ptr): void;
}

interface LocaleStatic {
  createCanonical(name: Char16Ptr): TLocale;
}

export declare class TLocale extends CClass {
  static createCanonical(name: Char16Ptr): TLocale
  getLanguage(): string
}

export interface BreakIteratorStatic {
  createLineInstance(locale: Locale): TBreakIterator;
  createCharacterInstance(locale: Locale): TBreakIterator;
}

export declare class TBreakIterator extends CClass {
  setText(str: TUnicodeString): void
  first(): number
  next(): number
  previous(): number
  getRuleStatus(): number
  following(offset: number): number
  preceding(offset: number): number
  isBoundary(offset: number): number
}

interface UnicodeStringStatic {
  fromUTF8(str: TStringPiece): TUnicodeString;
}

export declare class TUnicodeString extends CClass {
  appendChar16(char16: number): TUnicodeString
  appendUnicodeString(s: TUnicodeString): TUnicodeString
  length(): number
  isEmpty(char16: number): number
  getBuffer(): Ptr
  tempSubStringBetween(start: number, limit: number): TUnicodeString
  reverse(): TUnicodeString
  toUTF8String(): string
  charAt(idx: number): number
}

interface UnicodeStringConstructor {
  new(): TUnicodeString;
}

export declare class TStringPiece extends CClass {
}

interface StringPieceConstructor {
  new(c_str_ptr: Ptr, len: number): TStringPiece;
}

export interface RecentEmscriptenModule extends EmscriptenModule {
  allocateUTF8(str: string): Ptr;
  ready: Promise<ICUModule>;
  getValue(ptr: number, type: 'i8' | 'i16' | 'i32' | 'i64' | 'float' | 'double' | 'i8*' | 'i16*' | '*'): number;
  _malloc(len: number): number;
  _free(prt: number): void;
}

export type UBiDiPtr = number
export type UBiDiLevel = number

declare const ICUModuleFactory: EmscriptenModuleFactory<RecentEmscriptenModule>;

export default ICUModuleFactory;
