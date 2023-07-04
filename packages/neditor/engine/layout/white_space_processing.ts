import { PropertyValue } from '../cssom/property_value';
import { KeywordValue } from '../cssom/keyword_value';
import { IsWhiteSpace } from '../cssom/character_classification';

// https://www.w3.org/TR/css-text-3/#white-space-property
export function DoesCollapseSegmentBreaks(value: PropertyValue): boolean {
  return value != KeywordValue.GetPre() &&
    value != KeywordValue.GetPreLine() &&
    value != KeywordValue.GetPreWrap();
}

// "white-space" property values "pre", and "pre-wrap" preserve whitespace,
// while other values collapse it.
// https://www.w3.org/TR/css-text-3/#white-space
export function DoesCollapseWhiteSpace(value: PropertyValue): boolean {
  return value != KeywordValue.GetPre() &&
    value != KeywordValue.GetPreWrap();
}

// "white-space" property values "pre", and "nowrap" prevent wrapping, while
// other values allow it.
// https://www.w3.org/TR/css-text-3/#white-space
export function DoesAllowTextWrapping(value: PropertyValue): boolean {
  return value != KeywordValue.GetPre() &&
    value != KeywordValue.GetNowrap();
}

// Performs white space collapsing and transformation that correspond to
// the phase I of the white space processing.
//   https://www.w3.org/TR/css3-text/#white-space-phase-1
export function CollapseWhiteSpace(text: string): string {
  let input_iterator = 0;
  let input_end_iterator = text.length - 1;
  let output = [];

  // Per the specification, any space immediately following another
  // collapsible space is collapsed to have zero advance width. We approximate
  // this by replacing adjacent spaces with a single space.
  let { result: skip_result, input_iterator: input_iterator_result } = SkipWhiteSpaceAndAdvance(text, input_iterator, input_end_iterator);
  input_iterator = input_iterator_result;
  if (skip_result) {
    output.push(' ');
  }

  while (true) {
    let {
      result: copy_result,
      input_iterator: input_iterator_result_2,
    }
      = CopyNonWhiteSpaceAndAdvance(text, input_iterator, input_end_iterator, output);
    input_iterator = input_iterator_result_2;
    if (!copy_result) break;
    let { result: skip_result, input_iterator: input_iterator_result } = SkipWhiteSpaceAndAdvance(text, input_iterator, input_end_iterator);
    input_iterator = input_iterator_result;
    if (!skip_result) break;
    output.push(' ');
  }

  return output.join('');
}

// Returns true if skipped at least one white space character.
function SkipWhiteSpaceAndAdvance(
  str: string,
  input_iterator: number,
  input_end_iterator: number): { result: boolean, input_iterator: number } {
  let skipped_at_least_one = false;

  for (; input_iterator <= input_end_iterator; ++input_iterator) {
    if (!IsWhiteSpace(str[input_iterator])) {
      break;
    }

    skipped_at_least_one = true;
  }

  return {
    result: skipped_at_least_one,
    input_iterator,
  };
}

// Returns true if copied at least one character that is not a white space.
function CopyNonWhiteSpaceAndAdvance(
  input: string,
  input_iterator: number,
  input_end_iterator: number,
  output: string[]): { result: boolean, input_iterator: number, } {
  let copied_at_least_one = false;

  for (; input_iterator <= input_end_iterator; ++input_iterator) {
    let character = input[input_iterator];
    if (IsWhiteSpace(character)) {
      break;
    }

    copied_at_least_one = true;
    output.push(character);
  }

  return {
    result: copied_at_least_one,
    input_iterator,
  };
}

export function FindNextNewlineSequence(utf8_text: string, index: number): {
  result: boolean,
  sequence_start: number,
  sequence_length: number,
} {
  let sequence_start = utf8_text.length;
  let sequence_length = 0;

  // For CSS processing... CRLF sequence (U+000D U+000A), carriage return
  // (U+000D), and line feed (U+000A) in the text is treated as a segment break.
  //   https://www.w3.org/TR/css3-text/#white-space-processing
  for (; index < utf8_text.length; ++index) {
    let character = utf8_text[index];
    if (character == '\r') {
      sequence_start = index++;
      if (index < utf8_text.length && utf8_text[index] == '\n') {
        sequence_length = 2;
      } else {
        sequence_length = 1;
      }
      break;
    } else if (character == '\n') {
      sequence_start = index;
      sequence_length = 1;
      break;
    }
  }

  return {
    result: sequence_length > 0,
    sequence_length,
    sequence_start
  };
}
