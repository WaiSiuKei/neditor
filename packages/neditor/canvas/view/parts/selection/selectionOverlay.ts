import { Disposable, toDisposable } from '@neditor/core/base/common/lifecycle';
import { Selection, SelectionType } from '@neditor/core/engine/editing/selection';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { createApp, reactive } from 'vue';
import { DCHECK } from '../../../../base/check';
import { DCHECK_EQ } from '../../../../base/check_op';
import { HTMLDivElement } from '../../../../engine/dom/html_div_element';
import { HTMLParagraphElement } from '../../../../engine/dom/html_paragraph_element';
import { NodeTraversal } from '../../../../engine/dom/node_traversal';
import { Text } from '../../../../engine/dom/text';
import type { LayoutManager } from '../../../../engine/layout/layout_manager';
import { IMVVMStatus } from '../../../canvas/canvas';
import SelectionAPP from './selectionRects.vue';
import { Rect } from '@neditor/core/base/common/geometry';
import { TextBox } from '@neditor/core/engine/layout/text_box';

function offsetInBox(textBox: TextBox, offset: number): boolean {
  const textStartPosition = textBox.GetTextStartPosition();
  const textEndPosition = textBox.GetTextEndPosition();
  return textStartPosition <= offset && textEndPosition >= offset;
}

export class SelectionOverlay extends Disposable {
  rects: Array<Rect>;
  constructor(
    private container: HTMLElement,
    private selection: Selection,
    private layoutManager: LayoutManager,
    private mvvm: IMVVMStatus,
  ) {
    super();

    this._register(selection.onDidChange(async () => {
      await mvvm.maybeWaitForReLayout();
      this.update();
    }));
    let div = document.createElement('div');
    container.appendChild(div);
    Object.assign(div.style, {
      pointerEvents: 'none'
    } as Partial<CSSStyleDeclaration>);
    this.rects = reactive([]);
    const app = createApp(SelectionAPP, { rects: this.rects });
    app.mount(div);
    this._register(toDisposable(() => app.unmount()));
  }

  update() {
    switch (this.selection.type) {
      case SelectionType.None:
      case SelectionType.Caret:
        this.rects.length = 0;
        break;
      case SelectionType.Range:
        this.doUpdateSelection();
        break;
    }
  }

  doUpdateSelection() {
    this.rects.length = 0;
    const { anchorNode, focusNode, anchorOffset, focusOffset } = this.selection;
    DCHECK(anchorNode);
    DCHECK(focusNode);
    DCHECK(anchorOffset);
    DCHECK(focusOffset);
    if (anchorNode.IsText()) {
      return this.doUpdateSelectionInsideText();
    } else {
      return this.doUpdateSelectionInsideElement();
    }
  }

  doUpdateSelectionInsideText() {
    const { anchorNode, focusNode, anchorOffset, focusOffset } = this.selection;
    DCHECK(anchorNode);
    DCHECK(focusNode);
    DCHECK(anchorOffset);
    DCHECK(focusOffset);
    let startTextNode = anchorNode.AsText()!;
    let endTextNode = focusNode.AsText()!;
    if (startTextNode.parentNode !== endTextNode.parentNode) {
      return this.updateMultiParagraphSelection(startTextNode, endTextNode, anchorOffset, focusOffset);
    } else {
      return this.updateSingleParagraphSelection(startTextNode, endTextNode, anchorOffset, focusOffset);
    }
  }

  doUpdateSelectionInsideElement() {
    const { anchorNode, focusNode, anchorOffset, focusOffset } = this.selection;
    DCHECK(anchorNode);
    DCHECK(focusNode);
    DCHECK(anchorOffset);
    DCHECK(focusOffset);
    const anchorEl = anchorNode.AsElement()!;
    const focusEl = focusNode.AsElement()!;
    DCHECK(anchorEl === focusEl);
    let toUpdate: HTMLParagraphElement[] = [];
    if (anchorEl.nodeName === HTMLDivElement.kTagName) {
      for (let i = anchorOffset; i < focusOffset; i++) {
        const n = anchorEl.childNodes[i];
        DCHECK(n?.IsElement());
        toUpdate.push(n.AsHTMLElement()!);
      }
    } else if (anchorEl.nodeName === HTMLParagraphElement.kTagName) {
      toUpdate.push(anchorEl.AsHTMLElement()!);
    } else {
      NOTREACHED();
    }
    this.updateSelectionOfP(toUpdate);
  }

  updateSelectionOfP(pArr: HTMLParagraphElement[]) {
    DCHECK(pArr.length);
    const paragraphs = Array.from(pArr).map(p => this.layoutManager.getParagraphOfNode(p!.firstChild!)!);

    for (let p of paragraphs) {
      const items = this.layoutManager.getRTreeItemsByParagraph(p);
      for (let item of items) {
        const textBox = item.box;
        const textStartPosition = textBox.GetTextStartPosition();
        const textEndPosition = textBox.GetTextEndPosition();
        this.rects.push(textBox.RectOfSlice(textStartPosition, textEndPosition));
      }
    }
  }

  updateMultiParagraphSelection(anchorNode: Text, focusNode: Text, anchorOffset: number, focusOffset: number) {
    const ancestor = NodeTraversal.CommonAncestor(anchorNode, focusNode);
    DCHECK(ancestor);
    DCHECK_EQ(ancestor, ancestor.parentNode!.parentNode);
    const paragraphs = Array.from(ancestor.childNodes)
      .filter(n => n?.IsElement())
      .map(p => this.layoutManager.getParagraphOfNode(p!.firstChild!)!);

    const anchorParagraph = this.layoutManager.getParagraphOfNode(anchorNode);
    DCHECK(anchorParagraph);
    const focusParagraph = this.layoutManager.getParagraphOfNode(focusNode);
    DCHECK(focusParagraph);
    const anchorParagraphIndex = paragraphs.indexOf(anchorParagraph);
    const focusParagraphIndex = paragraphs.indexOf(focusParagraph);

    const minParagraphIndex = Math.min(anchorParagraphIndex, focusParagraphIndex);
    const maxParagraphIndex = Math.max(anchorParagraphIndex, focusParagraphIndex);
    const totalMinOffset = minParagraphIndex === anchorParagraphIndex ? anchorOffset : focusOffset;
    const totalMaxOffset = minParagraphIndex === anchorParagraphIndex ? focusOffset : anchorOffset;
    for (let i = minParagraphIndex; i <= maxParagraphIndex; i++) {
      const items = this.layoutManager.getRTreeItemsByParagraph(paragraphs[i]);
      if (i === minParagraphIndex) {
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetTextStartPosition();
          const textEndPosition = textBox.GetTextEndPosition();
          if (textEndPosition > totalMinOffset) {
            this.rects.push(textBox.RectOfSlice(Math.max(textStartPosition, totalMinOffset), textEndPosition));
          }
        }
      } else if (i === maxParagraphIndex) {
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetTextStartPosition();
          const textEndPosition = textBox.GetTextEndPosition();
          if (textStartPosition < totalMaxOffset) {
            this.rects.push(textBox.RectOfSlice(textStartPosition, Math.min(textEndPosition, totalMaxOffset)));
          }
        }
      } else {
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetTextStartPosition();
          const textEndPosition = textBox.GetTextEndPosition();
          this.rects.push(textBox.RectOfSlice(textStartPosition, textEndPosition));
        }
      }
    }
  }

  updateSingleParagraphSelection(anchorNode: Text, focusNode: Text, anchorOffset: number, focusOffset: number) {
    const paragraphOfAnchor = this.layoutManager.getParagraphOfNode(anchorNode);
    if (anchorNode !== focusNode) {
      const paragraphOfFocus = this.layoutManager.getParagraphOfNode(focusNode);
      if (paragraphOfAnchor !== paragraphOfFocus) NOTREACHED();
    }
    DCHECK(paragraphOfAnchor);
    const items = this.layoutManager.getRTreeItemsByParagraph(paragraphOfAnchor);
    const minOffset = Math.min(anchorOffset, focusOffset);
    const maxOffset = Math.max(anchorOffset, focusOffset);
    for (let item of items) {
      const textBox = item.box;
      const textStartPosition = textBox.GetTextStartPosition();
      const textEndPosition = textBox.GetTextEndPosition();
      let minInBox = offsetInBox(textBox, minOffset);
      let maxInBox = offsetInBox(textBox, maxOffset);

      if (minInBox && !maxInBox) {
        this.rects.push(textBox.RectOfSlice(minOffset, textEndPosition));
      } else if (minInBox && maxInBox) {
        this.rects.push(textBox.RectOfSlice(minOffset, maxOffset));
      } else if (!minInBox && maxInBox) {
        this.rects.push(textBox.RectOfSlice(textStartPosition, maxOffset));
      } else if (minOffset <= textStartPosition && maxOffset >= textEndPosition) {
        this.rects.push(textBox.RectOfSlice(textStartPosition, textEndPosition));
      }
    }
  }
}
