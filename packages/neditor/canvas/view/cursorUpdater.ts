import { DCHECK } from '../../base/check';
import { tail } from '../../base/common/array';
import { Disposable } from '../../base/common/lifecycle';
import { NOTIMPLEMENTED, NOTREACHED } from '../../base/common/notreached';
import { HTMLDivElement } from '../../engine/dom/html_div_element';
import { HTMLParagraphElement } from '../../engine/dom/html_paragraph_element';
import { IMVVMStatus } from '../canvas/canvas';
import { CursorStyle, ICanvasView } from './view';

export class CursorUpdater extends Disposable {
  constructor(
    public view: ICanvasView,
    public mvvm: IMVVMStatus,
  ) {
    super();

    const selection = view.document.getSelection();
    this._register(selection.onDidChange(async () => {
      await this.mvvm.maybeWaitForReLayout();
      this._updateSelectionDisplay();
    }));
  }

  private _updateSelectionDisplay() {
    const selection = this.view.document.getSelection();

    if (selection.ranges.length) {
      this.view.setCursor(CursorStyle.text);
      const range = selection.getRangeAt(0);
      if (!range) NOTREACHED();
      const end = range.endContainer;
      const endOffset = range.endOffset;
      if (end.IsElement()) {
        if (end.tagName === HTMLParagraphElement.kTagName) {
          DCHECK(endOffset === 0 || endOffset === 1);
          const layoutObject = end.GetLayoutObject();
          const { box } = layoutObject;
          const rect = box.GetBorderBoxFromRoot(false);
          this.view.drawCursor({
            blockStart: rect.x().toFloat(),
            inlineSize: rect.height().toFloat(),
            inlineStart: rect.y().toFloat(),
          });
        } else if (end.tagName === HTMLDivElement.kTagName) {
          const el = end.childNodes[endOffset - 1];
          if (!el) NOTREACHED();
          DCHECK(el?.IsElement());
          if (el.firstChild && el.firstChild.IsText()) {
            const text = el.firstChild;
            const paragraph = this.view.layoutManager.getParagraphOfNode(text);
            if (!paragraph) NOTREACHED();
            const items = this.view.layoutManager.getRTreeItemsByParagraph(paragraph);
            const lastItem = tail(items);
            const textBox = lastItem.box;
            const textEndPosition = textBox.GetRenderedTextEndPosition();
            const rect = textBox.RectOfSlice(textEndPosition, textEndPosition);
            this.view.drawCursor({
              blockStart: rect.x,
              inlineSize: rect.height,
              inlineStart: rect.y,
            });
          } else {
            const layoutObject = el.GetLayoutObject();
            const { box } = layoutObject;
            const rect = box.GetBorderBoxFromRoot(false);
            this.view.drawCursor({
              blockStart: rect.x().toFloat(),
              inlineSize: rect.height().toFloat(),
              inlineStart: rect.y().toFloat(),
            });
          }
        } else {
          NOTIMPLEMENTED();
        }
      } else if (end.IsText()) {
        const paragraph = this.view.layoutManager.getParagraphOfNode(end);
        if (!paragraph) NOTREACHED();
        const items = this.view.layoutManager.getRTreeItemsByParagraph(paragraph);
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetRenderedTextStartPosition();
          const textEndPosition = textBox.GetRenderedTextEndPosition();
          if (textStartPosition > endOffset || textEndPosition < endOffset) continue;
          const rect = textBox.RectOfSlice(endOffset, endOffset);
          this.view.drawCursor({
            blockStart: rect.x,
            inlineSize: rect.height,
            inlineStart: rect.y,
          });
          break;
        }
      } else {
        NOTIMPLEMENTED();
      }
    } else {
      this.view.setCursor(CursorStyle.arrow);
      this.view.drawCursor(undefined);
    }
  }
}
