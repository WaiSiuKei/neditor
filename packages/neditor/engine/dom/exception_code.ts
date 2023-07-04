// DOMException's error code
// https://webidl.spec.whatwg.org/#idl-DOMException-error-names
export enum DOMExceptionCode {
  // DOMExceptions with the legacy error code.

  // Zero value is used for representing no exception.
  kNoError = 0,

  // The minimum value of the legacy error code of DOMException defined in
  // Web IDL.
  // https://webidl.spec.whatwg.org/#idl-DOMException
  kLegacyErrorCodeMin = 1,

  kIndexSizeError = 1,  // Deprecated. Use ECMAScript RangeError instead.
  // DOMStringSizeError (= 2) is deprecated and no longer supported.
  kHierarchyRequestError = 3,
  kWrongDocumentError = 4,
  kInvalidCharacterError = 5,
  // NoDataAllowedError (= 6) is deprecated and no longer supported.
  kNoModificationAllowedError = 7,
  kNotFoundError = 8,
  kNotSupportedError = 9,
  kInUseAttributeError = 10,  // Historical. Only used in setAttributeNode etc
                              // which have been removed from the DOM specs.
  kInvalidStateError = 11,
  // Web IDL 2.7.1 Error names
  // https://webidl.spec.whatwg.org/#idl-DOMException-error-names
  // Note: Don't confuse the "SyntaxError" DOMException defined here with
  // ECMAScript's SyntaxError. "SyntaxError" DOMException is used to report
  // parsing errors in web APIs, for example when parsing selectors, while
  // the ECMAScript SyntaxError is reserved for the ECMAScript parser.
  kSyntaxError = 12,
  kInvalidModificationError = 13,
  kNamespaceError = 14,
  // kInvalidAccessError is deprecated. Use ECMAScript TypeError for invalid
  // arguments, |kNotSupportedError| for unsupported operations, and
  // |kNotAllowedError| for denied requests instead.
  kInvalidAccessError = 15,  // Deprecated.
  // ValidationError (= 16) is deprecated and no longer supported.
  kTypeMismatchError = 17,  // Deprecated. Use ECMAScript TypeError instead.
  // SecurityError should be thrown with ExceptionState::ThrowSecurityError
  // with careful consideration about the message that is observable by web
  // author. Avoid using this error code unless it's really SecurityError.
  //
  // "NotAllowedError" is often a better choice because the error represetnts
  // "The request is not allowed by the user agent or the platform in the
  // current context, possibly because the user denied permission."
  // https://webidl.spec.whatwg.org/#idl-DOMException-error-names
  kSecurityError = 18,
  kNetworkError = 19,
  kAbortError = 20,
  kURLMismatchError = 21,
  kQuotaExceededError = 22,
  kTimeoutError = 23,
  kInvalidNodeTypeError = 24,
  kDataCloneError = 25,

  // The maximum value of the legacy error code of DOMException defined in
  // Web IDL.
  // https://webidl.spec.whatwg.org/#idl-DOMException
  kLegacyErrorCodeMax = 25,

  // DOMExceptions without the legacy error code.
  kEncodingError,
  kNotReadableError,
  kUnknownError,
  kConstraintError,
  kDataError,
  kTransactionInactiveError,
  kReadOnlyError,
  kVersionError,
  kOperationError,
  kNotAllowedError,

  // The rest of entries are defined out of scope of Web IDL.

  // DOMError (obsolete, not DOMException) defined in File system (obsolete).
  // https://www.w3.org/TR/2012/WD-file-system-api-20120417/
  kPathExistsError,

  // Push API
  //
  // PermissionDeniedError (obsolete) was replaced with NotAllowedError in the
  // standard.
  // https://github.com/WICG/BackgroundSync/issues/124
  kPermissionDeniedError,

  // Serial API - https://wicg.github.io/serial
  kBreakError,
  kBufferOverrunError,
  kFramingError,
  kParityError,

  // WebTransport - https://w3c.github.io/webtransport/
  kWebTransportError,

  kNumOfCodes,
};
