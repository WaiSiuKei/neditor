import { tail } from '../../base/common/array';
import { Disposable } from '../../base/common/lifecycle';
import { NOTIMPLEMENTED, NOTREACHED } from '../../base/common/notreached';
import { Optional } from '../../base/common/typescript';
import { IMVVMStatus } from '../canvas/canvas';
import { CursorStyle, ICanvasView, IPhysicalCursorPosition } from './view';

export class CursorUpdater extends Disposable {
  lastCursorPosition: Optional<IPhysicalCursorPosition>;
  lastPlacedAtLineEnd = false;
  lastPlacedAtParagraphEnd = false;
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
        NOTIMPLEMENTED();
        // if (end.tagName === HTMLParagraphElement.kTagName) {
        //   DCHECK(endOffset === 0 || endOffset === 1);
        //   const layoutObject = end.GetLayoutObject();
        //   const { box } = layoutObject;
        //   const rect = box.GetBorderBoxFromRoot(false);
        //   this.view.drawCursor({
        //     blockStart: rect.x().toFloat(),
        //     inlineSize: rect.height().toFloat(),
        //     inlineStart: rect.y().toFloat(),
        //   });
        //   debugger
        // } else if (end.tagName === HTMLDivElement.kTagName) {
        //   const el = end.childNodes[endOffset - 1];
        //   if (!el) NOTREACHED();
        //   DCHECK(el?.IsElement());
        //   if (el.firstChild && el.firstChild.IsText()) {
        //     const text = el.firstChild;
        //     const paragraph = this.view.layoutManager.getParagraphOfNode(text);
        //     if (!paragraph) NOTREACHED();
        //     const items = this.view.layoutManager.getRTreeItemsByParagraph(paragraph);
        //     const lastItem = tail(items);
        //     const textBox = lastItem.box;
        //     const textEndPosition = textBox.GetRenderedTextEndPosition();
        //     const rect = textBox.RectOfSlice(textEndPosition, textEndPosition);
        //     this.view.drawCursor({
        //       blockStart: rect.x,
        //       inlineSize: rect.height,
        //       inlineStart: rect.y,
        //     });
        //   } else {
        //     const layoutObject = el.GetLayoutObject();
        //     const { box } = layoutObject;
        //     const rect = box.GetBorderBoxFromRoot(false);
        //     this.view.drawCursor({
        //       blockStart: rect.x().toFloat(),
        //       inlineSize: rect.height().toFloat(),
        //       inlineStart: rect.y().toFloat(),
        //     });
        //     debugger;
        //   }
        // } else {
        //   NOTIMPLEMENTED();
        // }
      } else if (end.IsText()) {
        const paragraph = this.view.layoutManager.getParagraphOfNode(end);
        if (!paragraph) NOTREACHED();
        const items = this.view.layoutManager.getRTreeItemsByParagraph(paragraph);
        for (let item of items) {
          const textBox = item.box;
          const textStartPosition = textBox.GetRenderedTextStartPosition();
          const textEndPosition = textBox.GetRenderedTextEndPosition();
          if (textStartPosition > endOffset || textEndPosition < endOffset) continue;
          // endoffset 等于 textEndPosition 的话
          if (textEndPosition === endOffset) {
            let canShowAtEdge = (() => {
              // 现在是最后一行的
              if (item === tail(items)) {
                this.lastPlacedAtParagraphEnd = true;
                return true;
              }
              // 上次也是显示在行尾。支持在行尾上下移动光标的情况
              if (this.lastPlacedAtLineEnd) return true;
              // 之前有显示（但不在同一行的开头，需要支持在行首上下移动光标）
              if (this.lastCursorPosition) {
                const r = textBox.RectOfSlice(textStartPosition, textStartPosition);
                return r.y === this.lastCursorPosition.inlineStart && r.x !== this.lastCursorPosition.blockStart;
              }
              return false;
            })();
            if (!canShowAtEdge) continue;
          }
          this.lastPlacedAtLineEnd = textEndPosition === endOffset;
          const rect = textBox.RectOfSlice(endOffset, endOffset);
          this.lastCursorPosition = {
            blockStart: rect.x,
            inlineSize: rect.height,
            inlineStart: rect.y,
          };
          this.view.drawCursor(this.lastCursorPosition);
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
