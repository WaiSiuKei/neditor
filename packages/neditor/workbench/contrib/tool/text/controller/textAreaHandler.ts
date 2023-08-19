import './textAreaHandler.css';
import { isFirefox, isEdge } from '@neditor/core/base/browser/browser';
import * as browser from '@neditor/core/base/browser/browser';
import { createFastDomNode, FastDomNode } from '@neditor/core/base/browser/fastDomNode';
import { Disposable, toDisposable } from '@neditor/core/base/common/lifecycle';
import { toTramsform } from '../../../../../base/browser/css';
import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { NOTREACHED } from '../../../../../base/common/notreached';
import { OS } from '../../../../../base/common/platform';
import { Optional } from '../../../../../base/common/typescript';
import { ICanvasView, IPhysicalCursorPosition } from '../../../../../canvas/view/view';
import { IPasteData, ITextAreaInputHost, TextAreaInput, TextAreaWrapper } from './textAreaInput';
import { _debugComposition, ITypeData, TextAreaState } from './textAreaState';
import { ViewController } from '../view/viewController';

class VisibleTextAreaData {
  public readonly top: number;
  public readonly left: number;
  public readonly width: number;

  constructor(top: number, left: number, width: number) {
    this.top = top;
    this.left = left;
    this.width = width;
  }

  public setWidth(width: number): VisibleTextAreaData {
    return new VisibleTextAreaData(this.top, this.left, width);
  }
}

const canUseZeroSizeTextarea = (isEdge || isFirefox);

export class TextAreaHandler extends Disposable {
  private readonly _viewController: ViewController;
  private textAreaTop: number = 0;
  private textAreaLeft: number = 0;
  private textAreaSize: number = 0;

  public readonly textArea: FastDomNode<HTMLTextAreaElement>;
  public readonly textAreaCover: FastDomNode<HTMLElement>;
  private readonly _textAreaInput: TextAreaInput;

  constructor(
    viewController: ViewController,
    private view: ICanvasView,
  ) {
    super();

    this._viewController = viewController;

    // Text Area (The focus will always be in the textarea when the cursor is blinking)
    this.textArea = createFastDomNode(document.createElement('textarea'));
    this.textArea.setClassName('inputarea');
    this.textArea.setAttribute('wrap', 'off');
    this.textArea.setAttribute('autocorrect', 'off');
    this.textArea.setAttribute('autocapitalize', 'off');
    this.textArea.setAttribute('autocomplete', 'off');
    this.textArea.setAttribute('spellcheck', 'false');
    this.textArea.setAttribute('tabindex', '1');
    this._register(toDisposable(() => this.textArea.domNode.remove()));

    this.textAreaCover = createFastDomNode(document.createElement('div'));
    this.textAreaCover.setPosition('absolute');
    this._register(toDisposable(() => this.textAreaCover.domNode.remove()));

    this._register(view.onCursorMoved((pos) => this.handleCursorMoved(pos)));

    const textAreaInputHost: ITextAreaInputHost = {
      getScreenReaderContent(): TextAreaState {
        // We know for a fact that a screen reader is not attached
        // On OSX, we write the character before the cursor to allow for "long-press" composition
        // Also on OSX, we write the word before the cursor to allow for the Accessibility Keyboard to give good hints
        // const selection = this._selections[0];
        // if (isMacintosh && selection.isEmpty()) {
        //   const position = selection.getStartPosition();
        //
        //   let textBefore = this._getWordBeforePosition(position);
        //   if (textBefore.length === 0) {
        //     textBefore = this._getCharacterBeforePosition(position);
        //   }
        //
        //   if (textBefore.length > 0) {
        //     return new TextAreaState(textBefore, textBefore.length, textBefore.length, Range.fromPositions(position), 0);
        //   }
        // }
        // on macOS, write current selection into textarea will allow system text services pick selected text,
        // but we still want to limit the amount of text given Chromium handles very poorly text even of a few
        // thousand chars
        // (https://github.com/microsoft/vscode/issues/27799)
        const LIMIT_CHARS = 500;
        // if (platform.isMacintosh && !selection.isEmpty() && simpleModel.getValueLengthInRange(selection, EndOfLinePreference.TextDefined) < LIMIT_CHARS) {
        //   const text = simpleModel.getValueInRange(selection, EndOfLinePreference.TextDefined);
        //   return new TextAreaState(text, 0, text.length, selection, 0);
        // }

        // on Safari, document.execCommand('cut') and document.execCommand('copy') will just not work
        // if the textarea has no content selected. So if there is an editor selection, ensure something
        // is selected in the textarea.
        // if (browser.isSafari && !selection.isEmpty()) {
        //   const placeholderText = 'vscode-placeholder';
        //   return new TextAreaState(placeholderText, 0, placeholderText.length, null, undefined);
        // }

        return TextAreaState.EMPTY;
      }
    };

    const textAreaWrapper = this._register(new TextAreaWrapper(this.textArea.domNode));
    this._textAreaInput = this._register(new TextAreaInput(textAreaInputHost, textAreaWrapper, OS, browser));

    this._register(this._textAreaInput.onKeyDown((e: IKeyboardEvent) => {
      this._viewController.keyDown(e);
    }));

    this._register(this._textAreaInput.onPaste((e: IPasteData) => {
      //   let pasteOnNewLine = false;
      //   let multicursorText: string[] | null = null;
      //   let mode: string | null = null;
      //   if (e.metadata) {
      //     pasteOnNewLine = (this._emptySelectionClipboard && !!e.metadata.isFromEmptySelection);
      //     multicursorText = (typeof e.metadata.multicursorText !== 'undefined' ? e.metadata.multicursorText : null);
      //     mode = e.metadata.mode;
      //   }
      //   this._viewController.paste(e.text, pasteOnNewLine, multicursorText, mode);
    }));

    // this._register(this._textAreaInput.onCut(() => {
    //   this._viewController.cut();
    // }));

    this._register(this._textAreaInput.onType((e: ITypeData) => {
      if (e.replacePrevCharCnt || e.replaceNextCharCnt || e.positionDelta) {
        // must be handled through the new command
        if (_debugComposition) {
          console.log(` => compositionType: <<${e.text}>>, ${e.replacePrevCharCnt}, ${e.replaceNextCharCnt}, ${e.positionDelta}`);
        }
        this._viewController.compositionType(e.text, e.replacePrevCharCnt, e.replaceNextCharCnt, e.positionDelta);
      } else {
        if (_debugComposition) {
          console.log(` => type: <<${e.text}>>`);
        }
        this._viewController.type(e.text);
      }
    }));

    this._register(this._textAreaInput.onSelectionChangeRequest((modelSelection: Selection) => {
      NOTREACHED();
      // this._viewController.setSelection(modelSelection);
    }));

    this._register(this._textAreaInput.onCompositionStart((e) => {
      this._viewController.compositionStart();
    }));

    this._register(this._textAreaInput.onCompositionEnd(() => {
      this._viewController.compositionEnd();
    }));

    this._register(this._textAreaInput.onFocus(() => {
      this._viewController.focus();
    }));

    this._register(this._textAreaInput.onBlur(() => {
      this._viewController.blur();
    }));

    // this._register(IME.onDidChange(() => {
    //   this._ensureReadOnlyAttribute();
    // }));
  }

  public isFocused(): boolean {
    return this._textAreaInput.isFocused();
  }

  public focusTextArea(): void {
    this._textAreaInput.focusTextArea();
  }

  public blurTextArea(): void {
    this._textAreaInput.blurTextArea();
  }

  handleCursorMoved(pos: Optional<IPhysicalCursorPosition>) {
    if (pos) {
      this.textAreaLeft = pos.blockStart;
      this.textAreaTop = pos.inlineStart;
      this.textAreaSize = pos.inlineSize;
    } else {
      this.textAreaTop = 0;
      this.textAreaLeft = 0;
    }
    this.render();
  }

  // The textarea might contain some content when composition starts.
  //
  // When we make the textarea visible, it always has a height of 1 line,
  // so we don't need to worry too much about content on lines above or below
  // the selection.
  //
  // However, the text on the current line needs to be made visible because
  // some IME methods allow to move to other glyphs on the current line
  // (by pressing arrow keys).
  //
  // (1) The textarea might contain only some parts of the current line,
  // like the word before the selection. Also, the content inside the textarea
  // can grow or shrink as composition occurs. We therefore anchor the textarea
  // in terms of distance to a certain line start and line end.
  //
  // (2) Also, we should not make \t characters visible, because their rendering
  // inside the <textarea> will not align nicely with our rendering. We therefore
  // will hide (if necessary) some of the leading text on the current line.

  private render(): void {
    this._textAreaInput.writeScreenReaderContent('render');
    const ta = this.textArea;
    const tac = this.textAreaCover;

    const { textAreaTop, textAreaLeft } = this;
    ta.setFontSize(this.textAreaSize);
    ta.setLineHeight(this.textAreaSize);
    ta.setTop(textAreaTop);
    ta.setLeft(textAreaLeft);
    const transform = toTramsform(this.view.mx);
    ta.setTransform(transform);
    tac.setTop(textAreaTop);
    tac.setLeft(textAreaLeft);
    tac.setTransform(transform);

    if (canUseZeroSizeTextarea) {
      ta.setWidth(0);
      ta.setHeight(0);
      tac.setWidth(0);
      tac.setHeight(0);
      return;
    }

    // (in WebKit the textarea is 1px by 1px because it cannot handle input to a 0x0 textarea)
    // specifically, when doing Korean IME, setting the textarea to 0x0 breaks IME badly.
    ta.setWidth(1);
    ta.setHeight(1);
    tac.setWidth(1);
    tac.setHeight(1);
  }
}
