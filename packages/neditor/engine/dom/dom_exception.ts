import { DOMExceptionCode } from './exception_code';

export enum ExceptionCode {
  // If the error name does not have a corresponding code, set the code to 0.
  kNone = 0,

  // These errors have legacy code values (corresponding to the enum).
  kIndexSizeErr,                // Deprecated. Use RangeError instead.
  kDomstringSizeErr,            // Deprecated. Use RangeError instead.
  kHierarchyRequestErr,
  kWrongDocumentErr,
  kInvalidCharacterErr,
  kNoDataAllowedErr,            // Deprecated.
  kNoModificationAllowedErr,
  kNotFoundErr,
  kNotSupportedErr,
  kInuseAttributeErr,
  kInvalidStateErr,
  kSyntaxErr,
  kInvalidModificationErr,
  kNamespaceErr,
  // kInvalidAccessErr is Deprecated. Use TypeError for invalid arguments,
  // "NotSupportedError" DOMException for unsupported operations, and
  // "NotAllowedError" DOMException for denied requests instead.
  kInvalidAccessErr,
  kValidationErr,               // Deprecated.
  // Note that TypeMismatchErr is replaced by TypeError but we keep using it
  // to be in sync with Chrome.
  kTypeMismatchErr,
  kSecurityErr,
  kNetworkErr,
  kAbortErr,
  kUrlMismatchErr,
  kQuotaExceededErr,
  kTimeoutErr,
  kInvalidNodeTypeErr,
  kDataCloneErr,

  kHighestErrCodeValue = kDataCloneErr,

  // These errors have no legacy code values. They will use code kNone.
  kReadOnlyErr,
  kInvalidPointerIdErr,
  kNotAllowedErr
}

export class DOMException extends Error {
  static Raise(code: ExceptionCode) {
    throw new Error(code.toString());
  }

  constructor(msg: string, code: DOMExceptionCode) {super();}
}
