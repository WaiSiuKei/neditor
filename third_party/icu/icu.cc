#include <string>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <unicode/brkiter.h>
#include <unicode/udata.h>
#include <unicode/unistr.h>
#include <unicode/stringpiece.h>
#include <unicode/locid.h>
#include <unicode/ubidi.h>
#include "data.h"

using namespace icu_67;
using namespace emscripten;

// https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/js-break-iterator.cc;l=64;drc=fd90be207063904a40bf7868e2d40d71b68f25e1?q=BreakIterator::createCharacterInstance&ss=chromium%2Fchromium%2Fsrc
enum class BreakType {
    WORD = 1,
    CHARACTER = 2,
    SENTENCE = 3,
    LINE = 4
};

extern "C" {
static BreakIterator* createCharacterInstance(
    const Locale &icu_locale
) {
    UErrorCode status = U_ZERO_ERROR;
    BreakIterator *it = nullptr;
    it = BreakIterator::createCharacterInstance(icu_locale, status);

    if (U_FAILURE(status)) {
        return nullptr;
    }
    return it;
}

static BreakIterator* createLineInstance(
    const Locale &icu_locale
) {
    UErrorCode status = U_ZERO_ERROR;
    BreakIterator *it = nullptr;
    it = BreakIterator::createLineInstance(icu_locale, status);

    if (U_FAILURE(status)) {
        return nullptr;
    }
    return it;
}

EMSCRIPTEN_BINDINGS(icu) {
    enum_<BreakType>("BreakType")
        .value("WORD", BreakType::WORD)
        .value("CHARACTER", BreakType::CHARACTER)
        .value("SENTENCE", BreakType::SENTENCE)
        .value("LINE", BreakType::LINE)
        ;
    class_<UText>("UText");
    class_<Locale>("Locale")
        .function("getLanguage", optional_override([](const Locale& l){
            std::string str = std::string(l.getLanguage());
            return str;
        }))
        .class_function("createCanonical", optional_override([](uintptr_t locale_ptr){
            const char* locale = reinterpret_cast<char*>(locale_ptr);
            return Locale::createCanonical(locale);
        }))
        ;

    class_<BreakIterator>("BreakIterator")
        .function("setText", select_overload<void(const UnicodeString &)>(&BreakIterator::setText))
        .function("first", &BreakIterator::first)
        .function("next", select_overload<int32_t(void)>(&BreakIterator::next))
        .function("previous", &BreakIterator::previous)
        .function("getRuleStatus", &BreakIterator::getRuleStatus)
        .function("following", &BreakIterator::following)
        .function("preceding", &BreakIterator::preceding)
        .function("isBoundary", &BreakIterator::isBoundary)
        .class_function("createLineInstance", &createLineInstance, allow_raw_pointers())
        .class_function("createCharacterInstance", &createCharacterInstance, allow_raw_pointers())
        ;

    class_<StringPiece>("StringPiece")
        .constructor(optional_override([](
            uintptr_t c_str_ptr,
            int32_t len
        ){
            const char* c_str = reinterpret_cast<char*>(c_str_ptr);
            return StringPiece(c_str, len);
        }))
        ;

    class_<UnicodeString>("UnicodeString")
        .constructor(optional_override([](){
            return new UnicodeString();
        }))
        .class_function("fromUTF8", &UnicodeString::fromUTF8)
        .function("appendChar16", optional_override([](UnicodeString& s, uint16_t codePoint){
            char16_t c = static_cast<char16_t>(codePoint);
            return s.append(codePoint);
        }))
        .function("appendUnicodeString", select_overload<UnicodeString &(const UnicodeString &)>(&UnicodeString::append))
        .function("tempSubStringBetween", &UnicodeString::tempSubStringBetween)
        .function("reverse", select_overload<UnicodeString &(void)>(&UnicodeString::reverse))
        .function("length", &UnicodeString::length)
        .function("isEmpty", &UnicodeString::isEmpty)
        .function("getBuffer", optional_override([](const UnicodeString& s){
            const char16_t * buffer = s.getBuffer();
            return (long)buffer;
        }))
        .function("toUTF8String", optional_override([](const UnicodeString& s){
            std::string utf8_string;
            s.toUTF8String(utf8_string);
            return utf8_string;
        }))
        .function("isEmpty", &UnicodeString::isEmpty)
        .function("charAt", optional_override([](UnicodeString& s, int32_t offset){
            char16_t c = s.charAt(offset);
            return static_cast<int32_t>(c);
        }))
        ;

    function("init_icu", optional_override([](){
        UErrorCode err = U_ZERO_ERROR;
        udata_setCommonData(icudt67l_dat, &err);
        return static_cast<int32_t>(err);
    }));

    function("ubidi_openSized", optional_override([](
        int32_t maxLength,
        int32_t maxRunCount
    ){
        UErrorCode err = U_ZERO_ERROR;
        UBiDi* bidi = ubidi_openSized(maxLength, maxRunCount, &err);
        if (U_FAILURE(err)) {
            return 0L;
        }
        return (long)bidi;
    }));

    function("ubidi_close", optional_override([](
        uintptr_t p_ubidi
    ){
        UBiDi* bidi = reinterpret_cast<UBiDi*>(p_ubidi);
        ubidi_close(bidi);
    }));

    function("ubidi_setPara", optional_override([](
        uintptr_t ubidi_ptr,
        UnicodeString& unicode_text,
        UBiDiLevel paraLevel
    ){
        UErrorCode err = U_ZERO_ERROR;
        UBiDi* pBiDi = reinterpret_cast<UBiDi*>(ubidi_ptr);
        const UChar* text = toUCharPtr(unicode_text.getBuffer());
        int32_t length = unicode_text.length();
        ubidi_setPara(pBiDi, text, length, paraLevel, nullptr, &err);
        return static_cast<int32_t>(err);
    }));

    function("ubidi_countRuns", optional_override([](
        uintptr_t ubidi_ptr
    ){
        UErrorCode err = U_ZERO_ERROR;
        UBiDi* pBiDi = reinterpret_cast<UBiDi*>(ubidi_ptr);
        int32_t runs = ubidi_countRuns(pBiDi, &err);
        if (U_FAILURE(err)) {
            return -1;
        }
        return runs;
    }));

    function("ubidi_getLogicalRun", optional_override([](
        uintptr_t ubidi_ptr,
        int32_t logicalPosition,
        uintptr_t logicalLimit_ptr,
        uintptr_t level_ptr
    ){
        UErrorCode err = U_ZERO_ERROR;
        const UBiDi* pBiDi = reinterpret_cast<UBiDi*>(ubidi_ptr);
        int32_t * pLogicalLimit = reinterpret_cast<int32_t *>(logicalLimit_ptr);
        UBiDiLevel * pLevel = reinterpret_cast<UBiDiLevel *>(level_ptr);
        ubidi_getLogicalRun(pBiDi, logicalPosition, pLogicalLimit, pLevel);
    }));
}
}
