import { commonPrefixLength, commonSuffixLength } from '../../../../../../base/common/strings';

export const _debugComposition = false;

export interface ITextAreaWrapper {
  getValue(): string;
  setValue(reason: string, value: string): void;

  getSelectionStart(): number;
  getSelectionEnd(): number;
  setSelectionRange(reason: string, selectionStart: number, selectionEnd: number): void;
}

export interface ITypeData {
  text: string;
  replacePrevCharCnt: number;
  replaceNextCharCnt: number;
  positionDelta: number;
}

export class TextAreaState {

  public static readonly EMPTY = new TextAreaState('', 0, 0, null, undefined);

  constructor(
    public readonly value: string,
    /** the offset where selection starts inside `value` */
    public readonly selectionStart: number,
    /** the offset where selection ends inside `value` */
    public readonly selectionEnd: number,
    /** the editor range in the view coordinate system that matches the selection inside `value` */
    public readonly selection: any | null,
    /** the visible line count (wrapped, not necessarily matching \n characters) for the text in `value` before `selectionStart` */
    public readonly newlineCountBeforeSelection: number | undefined,
  ) { }

  public toString(): string {
    return `[ <${this.value}>, selectionStart: ${this.selectionStart}, selectionEnd: ${this.selectionEnd}]`;
  }
  public static readFromTextArea(textArea: ITextAreaWrapper, previousState: TextAreaState | null): TextAreaState {
    const value = textArea.getValue();
    const selectionStart = textArea.getSelectionStart();
    const selectionEnd = textArea.getSelectionEnd();
    let newlineCountBeforeSelection: number | undefined = undefined;
    if (previousState) {
      const valueBeforeSelectionStart = value.substring(0, selectionStart);
      const previousValueBeforeSelectionStart = previousState.value.substring(0, previousState.selectionStart);
      if (valueBeforeSelectionStart === previousValueBeforeSelectionStart) {
        newlineCountBeforeSelection = previousState.newlineCountBeforeSelection;
      }
    }
    return new TextAreaState(value, selectionStart, selectionEnd, null, newlineCountBeforeSelection);
  }

  public collapseSelection(): TextAreaState {
    if (this.selectionStart === this.value.length) {
      return this;
    }
    return new TextAreaState(this.value, this.value.length, this.value.length, null, undefined);
  }

  public writeToTextArea(reason: string, textArea: ITextAreaWrapper, select: boolean): void {
    // console.log(Date.now() + ': writeToTextArea ' + reason + ': ' + this.toString());
    textArea.setValue(reason, this.value);
    if (select) {
      textArea.setSelectionRange(reason, this.selectionStart, this.selectionEnd);
    }
  }

  public static deduceInput(previousState: TextAreaState, currentState: TextAreaState, couldBeEmojiInput: boolean): ITypeData {
    if (!previousState) {
      // This is the EMPTY state
      return {
        text: '',
        replacePrevCharCnt: 0,
        replaceNextCharCnt: 0,
        positionDelta: 0
      };
    }

    if (_debugComposition) {
      console.log('------------------------deduceInput');
      console.log(`PREVIOUS STATE: ${previousState.toString()}`);
      console.log(`CURRENT STATE: ${currentState.toString()}`);
    }

    const prefixLength = Math.min(
      commonPrefixLength(previousState.value, currentState.value),
      previousState.selectionStart,
      currentState.selectionStart
    );
    const suffixLength = Math.min(
      commonSuffixLength(previousState.value, currentState.value),
      previousState.value.length - previousState.selectionEnd,
      currentState.value.length - currentState.selectionEnd
    );
    const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
    const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
    const previousSelectionStart = previousState.selectionStart - prefixLength;
    const previousSelectionEnd = previousState.selectionEnd - prefixLength;
    const currentSelectionStart = currentState.selectionStart - prefixLength;
    const currentSelectionEnd = currentState.selectionEnd - prefixLength;

    if (_debugComposition) {
      console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
      console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
    }

    if (currentSelectionStart === currentSelectionEnd) {
      // no current selection
      const replacePreviousCharacters = (previousState.selectionStart - prefixLength);
      if (_debugComposition) {
        console.log(`REMOVE PREVIOUS: ${replacePreviousCharacters} chars`);
      }

      return {
        text: currentValue,
        replacePrevCharCnt: replacePreviousCharacters,
        replaceNextCharCnt: 0,
        positionDelta: 0
      };
    }

    // there is a current selection => composition case
    const replacePreviousCharacters = previousSelectionEnd - previousSelectionStart;
    return {
      text: currentValue,
      replacePrevCharCnt: replacePreviousCharacters,
      replaceNextCharCnt: 0,
      positionDelta: 0
    };
  }

  public static deduceAndroidCompositionInput(previousState: TextAreaState, currentState: TextAreaState): ITypeData {
    if (!previousState) {
      // This is the EMPTY state
      return {
        text: '',
        replacePrevCharCnt: 0,
        replaceNextCharCnt: 0,
        positionDelta: 0
      };
    }

    if (_debugComposition) {
      console.log('------------------------deduceAndroidCompositionInput');
      console.log(`PREVIOUS STATE: ${previousState.toString()}`);
      console.log(`CURRENT STATE: ${currentState.toString()}`);
    }

    if (previousState.value === currentState.value) {
      return {
        text: '',
        replacePrevCharCnt: 0,
        replaceNextCharCnt: 0,
        positionDelta: currentState.selectionEnd - previousState.selectionEnd
      };
    }

    const prefixLength = Math.min(commonPrefixLength(previousState.value, currentState.value), previousState.selectionEnd);
    const suffixLength = Math.min(commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd);
    const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
    const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
    const previousSelectionStart = previousState.selectionStart - prefixLength;
    const previousSelectionEnd = previousState.selectionEnd - prefixLength;
    const currentSelectionStart = currentState.selectionStart - prefixLength;
    const currentSelectionEnd = currentState.selectionEnd - prefixLength;

    if (_debugComposition) {
      console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
      console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
    }

    return {
      text: currentValue,
      replacePrevCharCnt: previousSelectionEnd,
      replaceNextCharCnt: previousValue.length - previousSelectionEnd,
      positionDelta: currentSelectionEnd - currentValue.length
    };
  }
}
