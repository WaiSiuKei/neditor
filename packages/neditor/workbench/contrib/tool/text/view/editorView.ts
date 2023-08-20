import { DCHECK } from '../../../../../base/check';
import { Disposable } from '../../../../../base/common/lifecycle';
import { Optional } from '../../../../../base/common/typescript';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation';
import { BlockNodeModelProxy } from '../../../../../platform/model/common/model';
import { IPhysicalCursorPosition } from '../common';
import { CursorUpdater } from './cursor/cursorUpdater';
import { TextCursor } from './cursor/textCursor';
import { createEditor, Editor } from '../editor';
import { TextAreaHandler } from './type/textAreaHandler';
import { EditorViewController } from './editorViewController';
import { Element } from '../../../../../engine/dom/element';

export class EditorView extends Disposable {
  _editor: Editor;
  _viewController: EditorViewController;
  _textAreaHandler: TextAreaHandler;
  _textCursor: TextCursor;
  _cursorUpdater: CursorUpdater;

  constructor(
    node: BlockNodeModelProxy,
    dom: Element,
    private canvas: ICanvas,
    onExit: () => void,
  ) {
    super();

    const editor = createEditor({
      root: node,
      el: dom.AsElement()!.AsHTMLElement()!,
    });
    this._editor = editor;
    Reflect.set(window, 'slate', this._editor);

    this._viewController = this._register(this.canvas.invokeWithinContext(accessor => {
      const instantiationService = accessor.get(IInstantiationService);
      return instantiationService.createInstance(
        EditorViewController,
        editor,
        this.canvas,
        onExit,
      );
    }));
    this._textAreaHandler = this._register(new TextAreaHandler(
      this._viewController,
      this.canvas.view,
    ));
    document.body.append(
      this._textAreaHandler.textArea.domNode,
      this._textAreaHandler.textAreaCover.domNode,
    );
    this._textAreaHandler.focusTextArea();
    this._textCursor = this._register(new TextCursor(document.body, this.canvas.view));
    this._cursorUpdater = new CursorUpdater(
      this.canvas.view,
      this._drawCursor.bind(this),
    );
  }

  private _drawCursor(position: Optional<IPhysicalCursorPosition>): void {
    DCHECK(this._textCursor);
    if (!position) {
      this._textCursor.update();
    } else {
      this._textCursor.update({
        left: position.blockStart,
        top: position.inlineStart,
        width: 1.5,
        height: position.inlineSize,
      });
    }
    DCHECK(this._textAreaHandler);
    this._textAreaHandler.handleCursorMoved(position);
  }
}
