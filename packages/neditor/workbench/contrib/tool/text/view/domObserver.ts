import { IEditorView } from './view';
import { Disposable, IDisposable } from '../../../../../base/common/lifecycle';
import { Optional } from '../../../../../base/common/typescript';
import {
  DOMNode,
  DOMSelectionRange,
  readDOMSelectionChange,
  selectionToDOM
} from './dom';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';

class SelectionState {
  anchorNode: DOMNode | null = null;
  anchorOffset: number = 0;
  focusNode: DOMNode | null = null;
  focusOffset: number = 0;

  set(sel: DOMSelectionRange) {
    this.anchorNode = sel.anchorNode;
    this.anchorOffset = sel.anchorOffset;
    this.focusNode = sel.focusNode;
    this.focusOffset = sel.focusOffset;
  }

  clear() {
    this.anchorNode = this.focusNode = null;
  }

  eq(sel: DOMSelectionRange) {
    return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset &&
      sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset;
  }
}

export class DOMObserver extends Disposable {
  flushingSoon = -1;
  listener: Optional<IDisposable>;
  currentSelection = new SelectionState;
  constructor(
    readonly view: IEditorView,
  ) {
    super();
    this.onSelectionChange = this.onSelectionChange.bind(this);
  }

  dispose() {
    this.listener?.dispose();
  }

  start() {
    this.connectSelection();
  }

  stop() {
    this.disconnectSelection();
  }

  connectSelection() {
    if (this.listener) return;
    this.listener = this.view.domSelection().onDidChange(this.onSelectionChange);
  }

  disconnectSelection() {
    this.listener?.dispose();
    this.listener = undefined;
  }

  onSelectionChange() {
    this.flush();
  }

  flush() {
    let { view } = this;
    if (!view.docView || this.flushingSoon > -1) return;
    let sel = view.domSelection();
    readDOMSelectionChange(this.view);
    if (view.docView.dirty) {
      NOTIMPLEMENTED();
    }
    if (!this.currentSelection.eq(sel)) {
      selectionToDOM(view);
    }
    this.currentSelection.set(sel);
  }

  forceFlush() {
    if (this.flushingSoon > -1) {
      window.clearTimeout(this.flushingSoon);
      this.flushingSoon = -1;
      this.flush();
    }
  }

  flushSoon() {
    if (this.flushingSoon < 0)
      this.flushingSoon = window.setTimeout(() => {
        this.flushingSoon = -1;
        this.flush();
      }, 20);
  }

  setCurSelection() {
    this.currentSelection.set(this.view.domSelection());
  }
}
