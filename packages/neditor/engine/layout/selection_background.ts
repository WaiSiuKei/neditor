import { DCHECK } from '../../base/check';
import { DCHECK_EQ } from '../../base/check_op';
import { NOTREACHED } from '../../base/common/notreached';
import { HTMLDivElement } from '../dom/html_div_element';
import { HTMLParagraphElement } from '../dom/html_paragraph_element';
import { NodeTraversal } from '../dom/node_traversal';
import { Text } from '../dom/text';
import { Selection, SelectionType } from '../editing/selection';
import { LayoutManager } from './layout_manager';
import { TextBox } from './text_box';

function offsetInBox(textBox: TextBox, offset: number): boolean {
  const textStartPosition = textBox.GetVisualTextStartPosition();
  const textEndPosition = textBox.GetVisualTextEndPosition();
  return textStartPosition <= offset && textEndPosition >= offset;
}

export class SelectionBackground {
  selected = new Set<TextBox>();
  constructor(
    private layoutManager: LayoutManager,
  ) {
  }

  update(selection: Selection) {
    this.clearSelectionBackground();
    switch (selection.type) {
      case SelectionType.None:
      case SelectionType.Caret:
        break;
      case SelectionType.Range:
        this.doUpdateSelection(selection);
        break;
    }
  }

  private clearSelectionBackground() {
    for (let box of this.selected) {
      box.unsetSelection();
    }
  }

  private doUpdateSelection(selection: Selection) {
    const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
    DCHECK(anchorNode);
    DCHECK(focusNode);
    DCHECK(anchorOffset);
    DCHECK(focusOffset);
    if (anchorNode.IsText()) {
      return this.doUpdateSelectionInsideText(selection);
    } else {
      return this.doUpdateSelectionInsideElement(selection);
    }
  }

  doUpdateSelectionInsideText(selection: Selection) {
    const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
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

  doUpdateSelectionInsideElement(selection: Selection) {
    const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
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
        const textStartPosition = textBox.GetVisualTextStartPosition();
        const textEndPosition = textBox.GetVisualTextEndPosition();
        textBox.setSelection(textStartPosition, textEndPosition);
        this.selected.add(textBox);
      }
    }
  }

  updateMultiParagraphSelection(anchorNode: Text, focusNode: Text, anchorOffset: number, focusOffset: number) {
    const ancestor = NodeTraversal.CommonAncestor(anchorNode, focusNode);
    DCHECK(ancestor);
    DCHECK_EQ(ancestor, ancestor.parentNode!.parentNode);
    const paragraphs = Array.from(ancestor.childNodes)
      .filter(n => n?.IsElement())
      .map(p => this.layoutManager.getParagraphOfNode(p!.firstChild!.firstChild!)!);

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
          const textStartPosition = textBox.GetVisualTextStartPosition();
          const textEndPosition = textBox.GetVisualTextEndPosition();
          if (textEndPosition > totalMinOffset) {
            textBox.setSelection(Math.max(textStartPosition, totalMinOffset), textEndPosition);
            this.selected.add(textBox);
          }
        }
      } else if (i === maxParagraphIndex) {
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetVisualTextStartPosition();
          const textEndPosition = textBox.GetVisualTextEndPosition();
          if (textStartPosition < totalMaxOffset) {
            textBox.setSelection(textStartPosition, Math.min(textEndPosition, totalMaxOffset));
            this.selected.add(textBox);
          }
        }
      } else {
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetVisualTextStartPosition();
          const textEndPosition = textBox.GetVisualTextEndPosition();
          textBox.setSelection(textStartPosition, textEndPosition);
          this.selected.add(textBox);
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
      const textStartPosition = textBox.GetVisualTextStartPosition();
      const textEndPosition = textBox.GetVisualTextEndPosition();
      let minInBox = offsetInBox(textBox, minOffset);
      let maxInBox = offsetInBox(textBox, maxOffset);

      if (minInBox && !maxInBox) {
        textBox.setSelection(minOffset, textEndPosition);
        this.selected.add(textBox);
      } else if (minInBox && maxInBox) {
        textBox.setSelection(minOffset, maxOffset);
        this.selected.add(textBox);
      } else if (!minInBox && maxInBox) {
        textBox.setSelection(textStartPosition, maxOffset);
        this.selected.add(textBox);
      } else if (minOffset <= textStartPosition && maxOffset >= textEndPosition) {
        textBox.setSelection(textStartPosition, textEndPosition);
        this.selected.add(textBox);
      }
    }
  }
}
