// 'normal': Lines may break only at allowed break points.
// 'break-word': An unbreakable 'word' may be broken at an an arbitrary
// point...
//   https://www.w3.org/TR/css-text-3/#overflow-wrap
import { BaseDirection } from './base_direction';
import { WrapOpportunityPolicy } from './line_wrapping';
import { DCHECK } from '@neditor/core/base/check';
import { LayoutUnit } from './layout_unit';
import { FontList } from '../dom/font_list';
import {
  kLeftToRightIsolateCharacter,
  kNewLineCharacter,
  kNoBreakSpaceCharacter,
  kObjectReplacementCharacter,
  kPopDirectionalIsolateCharacter,
  kRightToLeftIsolateCharacter,
  kSpaceCharacter
} from '../base/unicode/character_values';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { IDisposable, ReferenceCollection } from '@neditor/core/base/common/lifecycle';
import {
  _malloc,
  allocStr,
  BreakIterator,
  Locale,
  StringPiece,
  U_FAILURE, ubidi_countRuns, ubidi_getLogicalRun,
  ubidi_openSized,
  ubidi_setPara, UBiDiLevel,
  UnicodeString,
  getValue, _free,
  ubidi_close
} from '@neditor/icu';
import { BreakIteratorDone } from '@neditor/icu/src/icu-c';

export enum BreakPolicy {
  kBreakPolicyNormal,
  kBreakPolicyBreakWord,
};

export enum CodePoint {
  kLeftToRightIsolateCodePoint,
  kLineFeedCodePoint,
  kNoBreakSpaceCodePoint,
  kObjectReplacementCharacterCodePoint,
  kPopDirectionalIsolateCodePoint,
  kRightToLeftIsolateCodePoint,
};

// http://unicode.org/reports/tr9/#Directional_Formatting_Characters
export enum DirectionalFormatting {
  // Setting the "dir" attribute corresponds to using directional isolates.
  //   http://unicode.org/reports/tr9/#Markup_And_Formatting
  kLeftToRightDirectionalIsolate,
  kRightToLeftDirectionalIsolate,
};

export enum TextOrder {
  kLogicalTextOrder,
  kVisualTextOrder,
};

export enum TextTransform {
  kNoTextTransform,
  kUppercaseTextTransform,
}

export type DirectionalFormattingStack = DirectionalFormatting[]

class BidiLevelRun {
  constructor(
    public start_position_: number,
    public level_: number
  ) {
  }
}

type  BidiLevelRuns = BidiLevelRun[]

// The paragraph contains all of the text for a single layout paragraph. It
// handles both bidi and line breaking analysis for the text contained within
// it, while also serving as a repository for the text itself. Text boxes
// do not internally store their text, but instead keep a reference to their
// text paragraph along with their start and end indices within that paragraph,
// which allows them to retrieve both their specific text and any accompanying
// textual analysis from the text paragraph.
//
// The text paragraph is initially open and mutable. When the paragraph is
// closed, it becomes immutable and the Unicode bidirectional algorithm is
// applied to its text (http://www.unicode.org/reports/tr9/). The text runs
// generated from this analysis are later used to both split boxes and organize
// boxes within a line according to their bidi levels.
//
// During layout, the the text paragraph determines line breaking locations for
// its text at soft wrap opportunities
// (https://www.w3.org/TR/css-text-3/#soft-wrap-opportunity), according to the
// Unicode line breaking algorithm (http://www.unicode.org/reports/tr14/),
// which can result in text boxes being split.
export class Paragraph implements IDisposable {
  static ID = 1;
  public id: number = Paragraph.ID++;
  // A processed text in which:
  //   - collapsible white space has been collapsed and trimmed for both ends;
  //   - segment breaks have been transformed;
  //   - letter case has been transformed.
  private unicode_text_: UnicodeString;

  // The locale of the paragraph.
  private locale_: Locale;

  // The base direction of the paragraph.
  private base_direction_: BaseDirection;

  // The stack tracking all active directional formatting in the paragraph.
  // http://unicode.org/reports/tr9/#Directional_Formatting_Characters
  private directional_formatting_stack_: DirectionalFormattingStack;

  // The line break iterator to use when splitting the text boxes derived from
  // this text paragraph across multiple lines.
  line_break_iterator_: BreakIterator;
  character_break_iterator_: BreakIterator;

  // Whether or not the paragraph is open and modifiable or closed and
  // immutable.
  private is_closed_: boolean;

  // All of the bidi level runs contained within the paragraph.
  private level_runs_: BidiLevelRuns = [];

  // |last_retrieved_run_index_| is tracked so that the next retrieval search
  // begins from this index. The vase majority of run retrievals either retrieve
  // the same index as the previous one, or retrieve a neighboring index.
  private last_retrieved_run_index_: number;

  constructor(
    locale: Locale,
    base_direction: BaseDirection,
    directional_formatting_stack: DirectionalFormattingStack,
    line_break_iterator: BreakIterator,
    character_break_iterator: BreakIterator,
  ) {
    this.locale_ = locale;
    this.base_direction_ = base_direction;
    this.directional_formatting_stack_ = directional_formatting_stack;
    this.line_break_iterator_ = line_break_iterator;
    this.character_break_iterator_ = character_break_iterator;
    this.is_closed_ = false;
    this.last_retrieved_run_index_ = 0;

    this.level_runs_.push(
      new BidiLevelRun(0, ConvertBaseDirectionToBidiLevel(base_direction)));

    this.unicode_text_ = new UnicodeString();

    // Walk through the passed in directional formatting stack and add each
    // formatting to the text. This allows a paragraph to continue the directional
    // state of a prior paragraph.
    DCHECK(this.unicode_text_.length() === 0);
    for (let i = 0; i < this.directional_formatting_stack_.length; ++i) {
      if (this.directional_formatting_stack_[i] == DirectionalFormatting.kRightToLeftDirectionalIsolate) {
        this.unicode_text_.appendChar16(kRightToLeftIsolateCharacter);
      } else {
        this.unicode_text_.appendChar16(kLeftToRightIsolateCharacter);
      }
    }
  }

  dispose() {
    this.unicode_text_.delete();
  }

  // Append the string and return the position where the string begins.
  AppendUtf8String(utf8_string: string, text_transform: TextTransform = TextTransform.kNoTextTransform): number {
    let start_position = this.GetTextEndPosition();
    DCHECK(!this.is_closed_);
    if (!this.is_closed_) {
      const { object: { ptr: inputPtr, view: inputView }, dispose } = allocStr(utf8_string, true);
      const stringPiece = new StringPiece(inputPtr, inputView.length);
      let unicode_string = UnicodeString.fromUTF8(stringPiece);
      if (text_transform == TextTransform.kUppercaseTextTransform) {
        NOTIMPLEMENTED();
        // unicode_string.toUpper(locale_);
      }

      this.unicode_text_.appendUnicodeString(unicode_string);
      stringPiece.delete();
      unicode_string.delete();
      dispose();
    }

    return start_position;
  }

  AppendCodePoint(code_point: CodePoint): number {
    let start_position = this.GetTextEndPosition();
    DCHECK(!this.is_closed_);
    if (!this.is_closed_) {
      switch (code_point) {
        case CodePoint.kLeftToRightIsolateCodePoint:
          // If this is a directional isolate that is being added, then add it
          // to the directional formatting stack. This guarantees that a
          // corresponding pop directional isolate will later be added to the
          // text and allows later paragraphs to copy the directional state.
          // http://unicode.org/reports/tr9/#Explicit_Directional_Isolates
          this.directional_formatting_stack_.push(DirectionalFormatting.kLeftToRightDirectionalIsolate);
          this.unicode_text_.appendChar16(kLeftToRightIsolateCharacter);
          break;
        case CodePoint.kLineFeedCodePoint:
          this.unicode_text_.appendChar16(kNewLineCharacter);
          break;
        case CodePoint.kNoBreakSpaceCodePoint:
          this.unicode_text_.appendChar16(kNoBreakSpaceCharacter);
          break;
        case CodePoint.kObjectReplacementCharacterCodePoint:
          this.unicode_text_.appendChar16(kObjectReplacementCharacter);
          break;
        case CodePoint.kPopDirectionalIsolateCodePoint:
          this.directional_formatting_stack_.pop();
          this.unicode_text_.appendChar16(kPopDirectionalIsolateCharacter);
          break;
        case CodePoint.kRightToLeftIsolateCodePoint:
          // If this is a directional isolate that is being added, then add it
          // to the directional formatting stack. This guarantees that a
          // corresponding pop directional isolate will later be added to the
          // text and allows later paragraphs to copy the directional state.
          // http://unicode.org/reports/tr9/#Explicit_Directional_Isolates
          this.directional_formatting_stack_.push(DirectionalFormatting.kRightToLeftDirectionalIsolate);
          this.unicode_text_.appendChar16(kPopDirectionalIsolateCharacter);
          break;
      }
    }
    return start_position;
  }

  // Using the specified break policy, finds the last break position that fits
  // within the available width. In the case where overflow is allowed and no
  // break position is found within the available width, the first overflowing
  // break position is used instead.
  //
  // The parameter |break_width| indicates the width of the portion of the
  // substring coming before |break_position|.
  //
  // Returns false if no usable break position was found.
  FindBreakPosition(
    direction: BaseDirection,
    should_attempt_to_wrap: boolean,
    used_font: FontList,
    start_position: number,
    end_position: number,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean,
    allow_overflow: boolean,
    break_policy: BreakPolicy,
  ): { break_position: number, break_width: LayoutUnit, result: boolean } {
    DCHECK(this.is_closed_);

    let break_position: number;

    DCHECK(direction == this.base_direction_);
    if (this.AreInlineAndScriptDirectionsTheSame(direction, start_position) ||
      should_attempt_to_wrap) {
      break_position = start_position;
    } else {
      break_position = end_position;
    }
    let break_width = new LayoutUnit();

    // If overflow isn't allowed and there is no available width, then there is
    // nothing to do. No break position can be found.
    if (!allow_overflow && available_width.LE(new LayoutUnit())) {
      return {
        result: false,
        break_position,
        break_width,
      };
    }

    // Normal overflow is not allowed when the break policy is break-word, so
    // only attempt to find normal break positions if the break policy is normal
    // or there is width still available.
    // https://www.w3.org/TR/css-text-3/#overflow-wrap
    // NOTE: Normal break positions are still found when the break policy is
    // break-word and overflow has not yet occurred because width calculations are
    // more accurate between word intervals, as these properly take into complex
    // shaping. Due to this, calculating the width using word intervals until
    // reaching the final word that must be broken between grapheme clusters
    // results in less accumulated width calculation error.
    if (break_policy == BreakPolicy.kBreakPolicyNormal || available_width.GT(new LayoutUnit())) {
      // Only allow normal overflow if the policy is |kBreakPolicyNormal|;
      // otherwise, overflowing via normal breaking would be too greedy in what it
      // included and overflow wrapping will be attempted via word breaking.
      let allow_normal_overflow =
        allow_overflow && break_policy == BreakPolicy.kBreakPolicyNormal;

      // Find the last available normal break position. |break_position| and
      // |break_width| will be updated with the position of the last available
      // break position.
      let { break_position: break_position_result, break_width: break_width_result } = this.FindIteratorBreakPosition(
        direction,
        should_attempt_to_wrap,
        used_font,
        this.line_break_iterator_,
        start_position, end_position, available_width,
        should_collapse_trailing_white_space,
        allow_normal_overflow,
        break_position,
        break_width,
      );
      break_position = break_position_result;
      break_width = break_width_result;
    }

    // If break word is the break policy, attempt to break unbreakable "words" at
    // an arbitrary point, while still maintaining grapheme clusters as
    // indivisible units.
    // https://www.w3.org/TR/css3-text/#overflow-wrap
    if (break_policy == BreakPolicy.kBreakPolicyBreakWord) {
      // Only continue allowing overflow if the break position has not moved from
      // start, meaning that no normal break positions were found.
      if (this.AreInlineAndScriptDirectionsTheSame(direction, start_position) ||
        should_attempt_to_wrap) {
        allow_overflow = allow_overflow && (break_position == start_position);
      } else {
        allow_overflow = allow_overflow && (break_position == end_position);
      }

      // Find the last available break-word break position. |break_position| and
      // |break_width| will be updated with the position of the last available
      // break position. The search begins at the location of the last normal
      // break position that fit within the available width.
      if (this.AreInlineAndScriptDirectionsTheSame(direction, start_position) || should_attempt_to_wrap) {
        let { break_position: break_position_result, break_width: break_width_result } = this.FindIteratorBreakPosition(
          direction,
          should_attempt_to_wrap,
          used_font,
          this.character_break_iterator_,
          break_position,
          end_position,
          available_width,
          false,
          allow_overflow,
          break_position,
          break_width
        );
        break_position = break_position_result;
        break_width = break_width_result;
      } else {
        let {
          break_position: break_position_result,
          break_width: break_width_result
        } = this.FindIteratorBreakPosition(direction,
          should_attempt_to_wrap, used_font,
          this.character_break_iterator_,
          start_position,
          break_position, available_width,
          false,
          allow_overflow,
          break_position,
          break_width
        );
        break_position = break_position_result;
        break_width = break_width_result;
      }
    }

    // No usable break position was found if the break position has not moved
    // from the start position.
    if (this.AreInlineAndScriptDirectionsTheSame(direction, start_position) ||
      should_attempt_to_wrap) {
      return {
        result: break_position > start_position,
        break_width,
        break_position
      };
    } else {
      return {
        result: break_position < end_position,
        break_position,
        break_width,
      };
    }
  }

  GetNextBreakPosition(position: number, break_policy: BreakPolicy): number {
    let break_iterator = this.GetBreakIterator(break_policy);
    break_iterator.setText(this.unicode_text_);
    return break_iterator.following(position);
  }

  GetPreviousBreakPosition(position: number, break_policy: BreakPolicy): number {
    let break_iterator = this.GetBreakIterator(break_policy);
    break_iterator.setText(this.unicode_text_);
    return break_iterator.preceding(position);
  }

  IsBreakPosition(position: number, break_policy: BreakPolicy): boolean {
    let break_iterator = this.GetBreakIterator(break_policy);
    break_iterator.setText(this.unicode_text_);
    return Boolean(break_iterator.isBoundary(position));
  }

  RetrieveUtf8SubString(start_position: number, end_position: number,
                        text_order: TextOrder = TextOrder.kLogicalTextOrder): string {
    if (start_position < end_position) {

      let unicode_sub_string = this.unicode_text_.tempSubStringBetween(start_position, end_position);

      // Odd bidi levels signify RTL directionality. If the text is being
      // retrieved in visual order and has RTL directionality, then reverse the
      // text.
      if (text_order == TextOrder.kVisualTextOrder && this.IsRTL(start_position)) {
        unicode_sub_string.reverse();
      }

      let ret = unicode_sub_string.toUTF8String();
      unicode_sub_string.delete();
      return ret;
    }

    return '';
  }

  GetTextBuffer(): number {
    return this.unicode_text_.getBuffer();
  }

  GetText() {
    return this.unicode_text_;
  }

  GetLocale() {
    return this.locale_;
  }

  base_direction() {
    return this.base_direction_;
  }

  // Return the direction of the top directional formatting in the paragraph's
  // stack or the base direction if the stack is empty.
  GetDirectionalFormattingStackDirection(): BaseDirection {
    let stack_size = this.directional_formatting_stack_.length;
    if (stack_size > 0) {
      if (this.directional_formatting_stack_[stack_size - 1] ==
        DirectionalFormatting.kRightToLeftDirectionalIsolate) {
        return BaseDirection.kRightToLeftBaseDirection;
      } else {
        return BaseDirection.kLeftToRightBaseDirection;
      }
    } else {
      return this.base_direction_;
    }
  }

  GetBidiLevel(position: number): number {
    return this.level_runs_[this.GetRunIndex(position)].level_;
  }

  IsRTL(position: number): boolean {
    return (this.GetBidiLevel(position) % 2) == 1;
  }

  AreInlineAndScriptDirectionsTheSame(direction: BaseDirection,
                                      position: number): boolean {
    return ((direction == BaseDirection.kLeftToRightBaseDirection && !this.IsRTL(position)) ||
      (direction == BaseDirection.kRightToLeftBaseDirection && this.IsRTL(position)));
  }

  IsCollapsibleWhiteSpace(position: number): boolean {
    // Only check for the space character. Other collapsible white space
    // characters will have already been converted into the space characters and
    // do not need to be checked against.
    return this.unicode_text_.charAt(position) === kSpaceCharacter;
  }

  GetNextRunPosition(position: number,): { next_run_position?: number, result: boolean } {
    let next_run_index = this.GetRunIndex(position) + 1;
    if (next_run_index >= this.level_runs_.length) {
      return {
        result: false
      };
    } else {
      return {
        next_run_position: this.level_runs_[next_run_index].start_position_,
        result: true
      };
    }
  }

  GetTextEndPosition(): number {
    return this.unicode_text_.length();
  }

  GetTextPositionAtVisualLocation(
    direction: BaseDirection,
    used_font: FontList,
    start_position: number,
    end_position: number,
    limit: number,
  ): number {
    let i = 1;
    let usedLength = 0;
    let baseMatchPosition = -1;
    for (; i + start_position <= end_position; i++) {
      const currentWidth = used_font.GetTextWidth(
        this.unicode_text_,
        start_position,
        i,
        this.IsRTL(start_position)
      );
      if (currentWidth >= limit) {
        let currentCharIsBestMatch = Math.abs(currentWidth - limit) < Math.abs(usedLength - limit);
        usedLength = currentCharIsBestMatch ? currentWidth : usedLength;
        baseMatchPosition = currentCharIsBestMatch ? start_position + i : start_position + i - 1;
        break;
      }
      usedLength = currentWidth;
    }
    if (limit > usedLength) baseMatchPosition = end_position;

    return baseMatchPosition;
  }

  GetSubstrWidth(
    direction: BaseDirection,
    used_font: FontList,
    start_position: number,
    offset: number,
  ): number {
    return used_font.GetTextWidth(
      this.unicode_text_,
      start_position,
      offset,
      this.IsRTL(start_position)
    );
  }

  // Return the full directional formatting stack for the paragraph. This allows
  // newly created paragraphs to copy the directional state of a preceding
  // paragraph.
  GetDirectionalFormattingStack(): DirectionalFormattingStack {
    return this.directional_formatting_stack_;
  }

  // Close the paragraph so that it becomes immutable and generates the text
  // runs.
  Close() {
    DCHECK(!this.is_closed_);
    if (!this.is_closed_) {
      // Terminate all of the explicit directional isolates that were previously
      // added. However, do not clear the stack. A subsequent paragraph may need
      // to copy it.
      // http://unicode.org/reports/tr9/#Terminating_Explicit_Directional_Isolates
      for (let count = this.directional_formatting_stack_.length; count > 0;
           --count) {
        this.unicode_text_.appendChar16(kPopDirectionalIsolateCharacter);
      }

      this.is_closed_ = true;
      this.GenerateBidiLevelRuns();
    }
  }

  IsClosed(): boolean {
    return this.is_closed_;
  }

  // private:
  private GetBreakIterator(break_policy: BreakPolicy): BreakIterator {
    return break_policy == BreakPolicy.kBreakPolicyNormal ? this.line_break_iterator_ : this.character_break_iterator_;
  }

  // Iterate over text segments as determined by the break iterator's strategy
  // from the starting position, adding the width of each segment and
  // determining the last one that fits within the available width. In the case
  // where |allow_overflow| is true and the first segment overflows the width,
  // that first overflowing segment will be included. The parameter
  // |break_width| indicates the width of the portion of the substring coming
  // before |break_position|.
  private FindIteratorBreakPosition(
    direction: BaseDirection,
    should_attempt_to_wrap: boolean,
    used_font: FontList,
    break_iterator: BreakIterator,
    start_position: number,
    end_position: number,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean,
    allow_overflow: boolean,
    break_position: number,
    break_width: LayoutUnit,
  ): { break_position: number, break_width: LayoutUnit } {
    // Iterate through break segments, beginning from the passed in start
    // position. Continue until TryIncludeSegmentWithinAvailableWidth() returns
    // false, indicating that no more segments can be included.
    break_iterator.setText(this.unicode_text_);
    if (this.AreInlineAndScriptDirectionsTheSame(direction, start_position) || should_attempt_to_wrap) {
      for (let segment_end = break_iterator.following(start_position); segment_end != BreakIteratorDone && segment_end < end_position; segment_end = break_iterator.next()) {
        let {
          result,
          break_position: break_position_result,
        } = this.TryIncludeSegmentWithinAvailableWidth(
          direction, should_attempt_to_wrap, used_font, break_position,
          segment_end, available_width,
          should_collapse_trailing_white_space, allow_overflow,
          break_position, break_width);
        break_position = break_position_result;
        if (!result) {
          break;
        }
      }
    } else {
      for (let segment_begin = break_iterator.preceding(end_position);
           segment_begin != BreakIteratorDone &&
           segment_begin > start_position;
           segment_begin = break_iterator.previous()) {
        let { result, break_position: break_position_result } = this.TryIncludeSegmentWithinAvailableWidth(
          direction, should_attempt_to_wrap, used_font, segment_begin,
          break_position, available_width,
          should_collapse_trailing_white_space, allow_overflow,
          break_position, break_width);
        break_position = break_position_result;
        if (!result) {
          break;
        }
      }
    }
    return {
      break_width,
      break_position,
    };
  }

  // Attempt to include the specified segment within the available width. If
  // either the segment fits within the width or |allow_overflow| is true, then
  // |break_position| and |break_width| are updated to include the segment.
  // NOTE: When |should_collapse_trailing_white_space| is true, then trailing
  // white space in the segment is not included when determining if the segment
  // can fit within the available width.
  //
  // |allow_overflow| is always set to false after the first segment is added,
  // ensuring that only the first segment can overflow the available width.
  //
  // Returns false if the specified segment exceeded the available width.
  // However, as a result of overflow potentially being allowed, a return value
  // of false does not guarantee that the segment was not included, but simply
  // that no additional segments can be included.
  private TryIncludeSegmentWithinAvailableWidth(
    direction: BaseDirection,
    should_attempt_to_wrap: boolean,
    used_font: FontList,
    segment_start: number,
    segment_end: number,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean,
    allow_overflow: boolean,
    break_position: number,
    break_width: LayoutUnit,
  ): { break_position: number, result: boolean, allow_overflow: boolean } {
    // Add the width of the segment encountered to the total, until reaching one
    // that causes the available width to be exceeded. The previous break position
    // is the last usable one. However, if overflow is allowed and no segment has
    // been found, then the first overflowing segment is accepted.
    let segment_width = new LayoutUnit(used_font.GetTextWidth(
      this.unicode_text_,
      segment_start,
      segment_end - segment_start,
      this.IsRTL(segment_start)));

    // If trailing white space is being collapsed, then it will not be included
    // when determining if the segment can fit within the available width.
    // However, it is still added to |break_width|, as it will impact the
    // width available to additional segments.
    let collapsible_trailing_white_space_width =
      new LayoutUnit(should_collapse_trailing_white_space &&
      this.IsCollapsibleWhiteSpace(segment_end - 1)
        ? used_font.GetSpaceWidth()
        : 0);

    if (!allow_overflow && break_width.ADD(segment_width).SUB(collapsible_trailing_white_space_width).GT(available_width)) {
      return {
        result: false,
        allow_overflow,
        break_position,
      };
    }

    if (this.AreInlineAndScriptDirectionsTheSame(direction, segment_start) || should_attempt_to_wrap) {
      break_position = segment_end;
    } else {
      break_position = segment_start;
    }
    break_width.ADD_ASSIGN(segment_width);

    if (allow_overflow) {
      allow_overflow = false;
      if (break_width.GE(available_width)) {
        return {
          result: false,
          allow_overflow,
          break_position,
        };
      }
    }

    return {
      result: true,
      allow_overflow,
      break_position,
    };
  }

  // Should only be called by Close().
  GenerateBidiLevelRuns() {
    DCHECK(this.is_closed_);

    // Create a scoped ubidi ptr when opening the text. It guarantees that the
    // UBiDi object will be closed when it goes out of scope.
    const len = this.unicode_text_.length();
    if (len === 0) return;
    const ubidi = ubidi_openSized(len, 0);
    try {
      if (!ubidi) {
        return;
      }

      const error = ubidi_setPara(
        ubidi,
        this.unicode_text_,
        ConvertBaseDirectionToBidiLevel(this.base_direction_) as UBiDiLevel);
      if (U_FAILURE(error)) {
        return;
      }

      let runs = ubidi_countRuns(ubidi);
      DCHECK(runs);
      if (runs === -1) {
        return;
      }

      this.level_runs_.length = 0;

      let run_start_position = 0;
      // int是4字节
      let run_end_position_ptr = _malloc(4);
      let run_ubidi_level_ptr = _malloc(4);

      let text_end_position = this.GetTextEndPosition();
      while (run_start_position < text_end_position) {
        ubidi_getLogicalRun(ubidi, run_start_position, run_end_position_ptr, run_ubidi_level_ptr);
        let run_ubidi_level = getValue(run_ubidi_level_ptr, 'i32');
        let run_end_position = getValue(run_end_position_ptr, 'i32');
        // run_ubidi_level 有时是负数，奇怪
        if (run_ubidi_level < 0 && run_end_position === text_end_position) {
          run_ubidi_level = 0;
        }
        this.level_runs_.push(new BidiLevelRun(run_start_position, (run_ubidi_level)));
        run_start_position = run_end_position;
      }
      _free(run_end_position_ptr);
      _free(run_ubidi_level_ptr);
    } finally {
      ubidi_close(ubidi);
    }
  }

  private GetRunIndex(position: number): number {
    DCHECK(this.is_closed_);

    // Start the search from the last retrieved index. This is tracked because
    // the next retrieved run index is almost always either the same as the last
    // retrieved one or a neighbor of it, so this reduces nearly all calls to only
    // requiring a couple comparisons.

    // First iterate up the level run vector, finding the first element that has
    // a start position larger than the passed in position. The upward iteration
    // is stopped if the last element is reached.
    while (this.last_retrieved_run_index_ < this.level_runs_.length - 1 &&
    this.level_runs_[this.last_retrieved_run_index_].start_position_ < position) {
      ++this.last_retrieved_run_index_;
    }
    // Iterate down the level run vector until a start position smaller than or
    // equal to the passed in position is reached. This run contains the passed in
    // position. The start position of the first run has a value of 0 and serves
    // as a sentinel for the loop.
    while (this.level_runs_[this.last_retrieved_run_index_].start_position_ > position) {
      --this.last_retrieved_run_index_;
    }

    return this.last_retrieved_run_index_;
  }
}

function ConvertBaseDirectionToBidiLevel(base_direction: BaseDirection) {
  return base_direction == BaseDirection.kRightToLeftBaseDirection ? 1 : 0;
}

export function GetBreakPolicyFromWrapOpportunityPolicy(
  wrap_opportunity_policy: WrapOpportunityPolicy,
  does_style_allow_break_word: boolean): BreakPolicy {
  // Initialize here to prevent a potential compiler warning.
  let break_policy = BreakPolicy.kBreakPolicyNormal;
  switch (wrap_opportunity_policy) {
    case WrapOpportunityPolicy.kWrapOpportunityPolicyNormal:
      break_policy = BreakPolicy.kBreakPolicyNormal;
      break;
    case WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWord:
      break_policy = BreakPolicy.kBreakPolicyBreakWord;
      break;
    case WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWordOrNormal:
      break_policy = does_style_allow_break_word ? BreakPolicy.kBreakPolicyBreakWord
        : BreakPolicy.kBreakPolicyNormal;
      break;
  }
  return break_policy;
}

export class RefCountedParagraphCollection extends ReferenceCollection<Paragraph> {
  protected createReferencedObject(key: string, ...args: ConstructorParameters<typeof Paragraph>): Paragraph {
    return new Paragraph(...args);
  }
  protected destroyReferencedObject(key: string, object: Paragraph): void {
    object.dispose();
  }
}
