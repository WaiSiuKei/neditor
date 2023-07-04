import { U16_GET_SUPPLEMENTARY, U16_IS_TRAIL } from './utf';
import { kActivateArabicFormShapingCharacter, kActivateSymmetricSwappingCharacter, kArabicLetterMarkCharacter, kCarriageReturnCharacter, kFirstStrongIsolateCharacter, kFormFeedCharacter, kHorizontalTabulationCharacter, kInhibitArabicFormShapingCharacter, kInhibitSymmetricSwappingCharacter, kLeftToRightEmbeddingCharacter, kLeftToRightIsolateCharacter, kLeftToRightMarkCharacter, kNationalDigitShapesCharacter, kNewLineCharacter, kNoBreakSpaceCharacter, kNominalDigitShapesCharacter, kObjectReplacementCharacter, kPopDirectionalFormattingCharacter, kPopDirectionalIsolateCharacter, kRightToLeftIsolateCharacter, kRightToLeftMarkCharacter, kRightToLeftOverrideCharacter, kSoftHyphenCharacter, kSpaceCharacter, kZeroWidthJoinerCharacter, kZeroWidthNoBreakSpaceCharacter, kZeroWidthNonJoinerCharacter, kZeroWidthSpaceCharacter } from './character_values';

const complexCodePathRanges = [
  // U+02E5 through U+02E9 (Modifier Letters : Tone letters)
  0x2E5, 0x2E9,
  // U+0300 through U+036F Combining diacritical marks
  0x300, 0x36F,
  // U+0591 through U+05CF excluding U+05BE Hebrew combining marks, ...
  0x0591, 0x05BD,
  // ... Hebrew punctuation Paseq, Sof Pasuq and Nun Hafukha
  0x05BF, 0x05CF,
  // U+0600 through U+109F Arabic, Syriac, Thaana, NKo, Samaritan, Mandaic,
  // Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada,
  // Malayalam, Sinhala, Thai, Lao, Tibetan, Myanmar
  0x0600, 0x109F,
  // U+1100 through U+11FF Hangul Jamo (only Ancient Korean should be left
  // here if you precompose; Modern Korean will be precomposed as a result
  // of step A)
  0x1100, 0x11FF,
  // U+135D through U+135F Ethiopic combining marks
  0x135D, 0x135F,
  // U+1780 through U+18AF Tagalog, Hanunoo, Buhid, Taghanwa, Khmer,
  // Mongolian
  0x1700, 0x18AF,
  // U+1900 through U+194F Limbu (Unicode 4.0)
  0x1900, 0x194F,
  // U+1980 through U+19DF New Tai Lue
  0x1980, 0x19DF,
  // U+1A00 through U+1CFF Buginese, Tai Tham, Balinese, Batak, Lepcha,
  // Vedic
  0x1A00, 0x1CFF,
  // U+1DC0 through U+1DFF Combining diacritical mark supplement
  0x1DC0, 0x1DFF,
  // U+20D0 through U+20FF Combining marks for symbols
  0x20D0, 0x20FF,
  // U+2CEF through U+2CF1 Combining marks for Coptic
  0x2CEF, 0x2CF1,
  // U+302A through U+302F Ideographic and Hangul Tone marks
  0x302A, 0x302F,
  // Combining Katakana-Hiragana Voiced/Semi-voiced Sound Mark
  0x3099, 0x309A,
  // U+A67C through U+A67D Combining marks for old Cyrillic
  0xA67C, 0xA67D,
  // U+A6F0 through U+A6F1 Combining mark for Bamum
  0xA6F0, 0xA6F1,
  // U+A800 through U+ABFF Nagri, Phags-pa, Saurashtra, Devanagari Extended,
  // Hangul Jamo Ext. A, Javanese, Myanmar Extended A, Tai Viet, Meetei
  // Mayek
  0xA800, 0xABFF,
  // U+D7B0 through U+D7FF Hangul Jamo Ext. B
  0xD7B0, 0xD7FF,
  // U+FE00 through U+FE0F Unicode variation selectors
  0xFE00, 0xFE0F,
  // U+FE20 through U+FE2F Combining half marks
  0xFE20, 0xFE2F];
export function ContainsComplexScript(characters: number[]): boolean {

  let len = characters.length;
  for (let i = 0; i < len; i++) {
    let c = characters[i];

    // Shortcut for common case
    if (c < 0x2E5) {
      continue;
    }

    // Surrogate pairs
    if (c > 0xD7FF && c <= 0xDBFF) {
      if (i == len - 1) {
        continue;
      }

      let next = characters[++i];
      if (!U16_IS_TRAIL(next)) {
        continue;
      }
      let supplementaryCharacter = U16_GET_SUPPLEMENTARY(c, next);

      // U+1F1E6 through U+1F1FF Regional Indicator Symbols
      if (supplementaryCharacter < 0x1F1E6) {
        continue;
      }
      if (supplementaryCharacter <= 0x1F1FF) {
        return true;
      }

      // Man and Woman Emojies, in order to support emoji joiner combinations
      // for family and couple pictographs.
      // Compare http://unicode.org/reports/tr51/#Emoji_ZWJ_Sequences
      if (supplementaryCharacter < 0x1F468) {
        continue;
      }
      if (supplementaryCharacter <= 0x1F469) {
        return true;
      }

      // U+E0100 through U+E01EF Unicode variation selectors.
      if (supplementaryCharacter < 0xE0100) {
        continue;
      }
      if (supplementaryCharacter <= 0xE01EF) {
        return true;
      }

      // FIXME: Check for Brahmi (U+11000 block), Kaithi (U+11080 block) and
      // other complex scripts in plane 1 or higher.
      continue;
    }

    // Search for other Complex cases
    if (ValueInIntervalList(complexCodePathRanges, c)) {
      return true;
    }
  }

  return false;
}

// Takes a flattened list of closed intervals
function ValueInIntervalList(intervalList: number[], value: number) {
  // const  bound =
  //   std::upper_bound(&intervalList[0], &intervalList[size], value);
  // if ((bound - intervalList) % 2 == 1) return true;
  // return bound > intervalList && *(bound - 1) == value;
  for (let i = 0; i < intervalList.length; i += 2) {
    let start = intervalList[i];
    let end = intervalList[i + 1];
    if (start <= value && value <= end) return true;
  }
  return false;
}

function TreatAsSpace(c: number) {
  return c == kSpaceCharacter || c == kHorizontalTabulationCharacter ||
    c == kNewLineCharacter || c == kFormFeedCharacter ||
    c == kCarriageReturnCharacter || c == kNoBreakSpaceCharacter;
}

function TreatAsZeroWidthSpace(c: number): boolean {

  if (TreatAsZeroWidthSpaceInComplexScript(c)) {
    return true;
  }

  switch (c) {
    case kActivateArabicFormShapingCharacter:
    case kActivateSymmetricSwappingCharacter:
    case kArabicLetterMarkCharacter:
    case kFirstStrongIsolateCharacter:
    case kInhibitArabicFormShapingCharacter:
    case kInhibitSymmetricSwappingCharacter:
    case kLeftToRightIsolateCharacter:
    case kNationalDigitShapesCharacter:
    case kNominalDigitShapesCharacter:
    case kPopDirectionalFormattingCharacter:
    case kPopDirectionalIsolateCharacter:
    case kRightToLeftIsolateCharacter:
    case kSoftHyphenCharacter:
    case kZeroWidthNonJoinerCharacter:
    case kZeroWidthJoinerCharacter:
      return true;
  }

  return false;
}

function TreatAsZeroWidthSpaceInComplexScript(c: number) {
  return c < 0x20                    // ASCII Control Characters
    || (c >= 0x7F && c < 0xA0)  // ASCII Delete .. No-break spaceCharacter
    || c == kZeroWidthSpaceCharacter ||
    (c >= kLeftToRightMarkCharacter && c <= kRightToLeftMarkCharacter) ||
    (c >= kLeftToRightEmbeddingCharacter &&
      c <= kRightToLeftOverrideCharacter) ||
    c == kZeroWidthNoBreakSpaceCharacter ||
    c == kObjectReplacementCharacter || IsEmojiModifier(c);
}

function IsEmojiModifier(c: number) { return c >= 0x1F3FB && c <= 0x1F3FF; }

export function NormalizeSpaces(character: number): number {
  if (TreatAsSpace(character)) {
    return kSpaceCharacter;
  }

  if (TreatAsZeroWidthSpace(character)) {
    return kZeroWidthSpaceCharacter;
  }

  return character;
}
