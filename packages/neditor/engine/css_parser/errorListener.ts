import { ParserErrorListener } from 'antlr4ts';
import { Recognizer } from 'antlr4ts/Recognizer';
import { RecognitionException } from 'antlr4ts/RecognitionException';

export class InlineErrorListener implements ParserErrorListener {

  private _isValid = true;
  private _errorMessage: string | undefined;

  public get isValid() {
    return this._isValid;
  }

  public get errorMessage() {
    return this._errorMessage;
  }

  public syntaxError<T extends any>(recognizer: Recognizer<T, any>, offendingSymbol: T | undefined, line: number, charPositionInLine: number, msg: string, e: RecognitionException | undefined) {
    this._isValid = false;
    this._errorMessage = `line ${line}:${charPositionInLine} ${msg}`;
  }
}
