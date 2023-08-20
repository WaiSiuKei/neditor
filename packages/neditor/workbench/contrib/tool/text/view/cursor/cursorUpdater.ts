import { DCHECK } from '../../../../../../base/check';
import { tail } from '../../../../../../base/common/array';
import { Disposable } from '../../../../../../base/common/lifecycle';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../../../../base/common/notreached';
import { Optional } from '../../../../../../base/common/typescript';
import { CursorStyle, ICanvasView } from '../../../../../../canvas/view/view';
import { HTMLSpanElement } from '../../../../../../engine/dom/html_span_element';
import { IPhysicalCursorPosition } from '../../common';
import { EditorInterface } from '../editorInterface';

export class CursorUpdater extends Disposable {
  lastCursorPosition: Optional<IPhysicalCursorPosition>;
  lastPlacedAtLineEnd = false;
  lastPlacedAtParagraphEnd = false;
  constructor(
    public view: ICanvasView,
    public editor: EditorInterface,
    public update: (pos: Optional<IPhysicalCursorPosition>) => void,
  ) {
    super();

    const selection = view.document.getSelection();
    this._register(selection.onDidChange(() => {
      this._updateSelectionDisplay();
    }));
    this._updateSelectionDisplay();
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
        const lines = this.view.layoutManager.getContentOfParagraph(paragraph);
        for (const line of lines) {
          for (const item of line) {
            const textBox = item.box;
            // 排除同一段落内的其他 inline
            if (textBox.node !== end) continue;
            const textStartPosition = textBox.GetVisualTextStartPosition();
            const textEndPosition = textBox.GetVisualTextEndPosition();
            if (textStartPosition > endOffset || textEndPosition < endOffset) continue;
            if (textEndPosition === endOffset) {
              let canShowAtEdge = (() => {
                // 现在是最后一行
                if (line === tail(lines)) {
                  this.lastPlacedAtParagraphEnd = true;
                  return true;
                }

                // 上次也是显示在行尾。支持在行尾上下移动光标的情况
                // if (this.lastPlacedAtLineEnd) return true;

                // span 的结尾
                const parent = end.parentElement;
                DCHECK(parent);
                if (parent.tagName === HTMLSpanElement.kTagName) {
                  return true;
                }

                // 之前有显示（但不在同一行的开头，需要支持在行首上下移动光标）
                if (this.lastCursorPosition) {
                  const r = textBox.RectOfSlice(textStartPosition, textStartPosition);
                  return r.y === this.lastCursorPosition.inlineStart && r.x !== this.lastCursorPosition.blockStart;
                }
                return false;
              })();
              if (!canShowAtEdge) continue;
            }
            // this.lastPlacedAtLineEnd = textEndPosition === endOffset;
            const rect = textBox.RectOfSlice(endOffset, endOffset);
            this.lastCursorPosition = {
              blockStart: rect.x,
              inlineSize: rect.height,
              inlineStart: rect.y,
            };
            this.update(this.lastCursorPosition);
            break;
          }
        }
      } else {
        NOTIMPLEMENTED();
      }
    } else {
      this.view.setCursor(CursorStyle.arrow);
      this.update(undefined);
    }
  }
}
