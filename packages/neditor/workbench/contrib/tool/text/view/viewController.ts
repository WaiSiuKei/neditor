import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { DCHECK } from '../../../../../base/check';
import { KeyCode } from '../../../../../base/common/keyCodes';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';
import { captureKeyDown } from './capturekeys';
import { selectionToDOM } from './dom';
import { IEditorView } from './view';

export class ViewController {
  constructor(
    private view: IEditorView,
    private onEsc: () => void,
  ) {
  }
  public type(text: string): void {
    const { view } = this;
    if (!/[\r\n]/.test(text)) {
      view.dispatch(view.state.tr.insertText(text));
    }
  }

  public compositionType(text: string, replacePrevCharCnt: number, replaceNextCharCnt: number, positionDelta: number): void {
    DCHECK(!replaceNextCharCnt);
    DCHECK(!positionDelta);

    const { view } = this;
    const { state } = view;
    let { tr, selection } = state;
    const { head } = selection;
    if (replacePrevCharCnt) {
      tr.delete(head - replacePrevCharCnt, head);
    }
    tr.insertText(text);
    view.dispatch(tr);
  }

  public compositionStart(): void {
    const { view } = this;
    const { state } = view;
    const { selection } = state;
    if (!selection.empty) {
      let { tr } = state;
      view.dispatch(tr.deleteSelection());
    }
    DCHECK(selection.empty);
  }

  public compositionEnd(): void {
  }

  public keyDown(event: IKeyboardEvent): void {
    if (event.keyCode === KeyCode.Escape) {
      this.onEsc();
      return;
    }
    const { view } = this;
    view.input.shiftKey = event.keyCode === KeyCode.Shift || event.shiftKey;
    view.domObserver.forceFlush();
    if (view.someProp('handleKeyDown', f => f(view, event)) || captureKeyDown(view, event)) {
      event.preventDefault();
    }
  }

  public focus() {
    const { view } = this;

    view.input.lastFocus = Date.now();
    if (!view.focused) {
      // view.domObserver.stop();
      view.domObserver.start();
      view.focused = true;
      if (view.docView && view.hasFocus() && !view.domObserver.currentSelection.eq(view.domSelection()))
        selectionToDOM(view);
    }
  }

  public blur() {
    const { view } = this;

    if (view.focused) {
      view.domObserver.stop();
      // if (event.relatedTarget && view.dom.contains(event.relatedTarget as HTMLElement))
      //   view.domObserver.currentSelection.clear();
      view.focused = false;
    }
  }
}

