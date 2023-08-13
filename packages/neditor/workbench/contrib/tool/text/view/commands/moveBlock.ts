import { DCHECK } from '../../../../../../base/check';
import { tail } from '../../../../../../base/common/array';
import { KeyCode } from '../../../../../../base/common/keyCodes';
import { NOTREACHED } from '../../../../../../base/common/notreached';
import { ICanvas } from '../../../../../../canvas/canvas/canvas';
import { TextBox } from '../../../../../../engine/layout/text_box';
import { Editor } from '../../editor';
import { registerTextEditorCommand, TextEditorCommand } from '../platform';

enum BlockDirection {
  up,
  down,
}

class MoveBlockCommand extends TextEditorCommand {
  runTextEditorCommand(editor: Editor, canvas: ICanvas, dir: BlockDirection): void | Promise<void> {
    const { view } = canvas;
    const { document } = view;
    const selection = document.getSelection();
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

    const text = dir === BlockDirection.up ? anchorNode : focusNode;
    const offset = dir === BlockDirection.up ? anchorOffset : focusOffset;
    DCHECK(text);
    DCHECK(text.IsText());

    const span = text.parentElement!;
    const p = span.parentElement!;
    const pContainer = p.parentElement!;

    const paragraph = view.layoutManager.getParagraphOfNode(text);
    if (!paragraph) NOTREACHED();
    const items = view.layoutManager.getRTreeItemsByParagraph(paragraph);
    let boxIdx: number | undefined;
    let x: number | undefined;
    for (const item of items) {
      const textBox = item.box;
      const textStartPosition = textBox.GetRenderedTextStartPosition();
      const textEndPosition = textBox.GetRenderedTextEndPosition();
      if (textStartPosition > offset || textEndPosition < offset) continue;
      const rect = textBox.RelativeRectOfSlice(offset, offset);
      x = rect.x;
      boxIdx = items.indexOf(item);
      break;
    }
    DCHECK(boxIdx);
    DCHECK(x);
    let nextBox: TextBox | undefined;
    if (boxIdx === 0 && dir === BlockDirection.up || boxIdx === items.length - 1 && dir === BlockDirection.down) {
      const paragraphs = Array.from(pContainer.childNodes)
        .filter(n => n?.IsElement())
        .map(p => canvas.view.layoutManager.getParagraphOfNode(p!.firstChild!.firstChild!)!);
      const idxOfCurrentParagraph = paragraphs.indexOf(paragraph);
      const nextParagraph = paragraphs[dir === BlockDirection.up ? idxOfCurrentParagraph - 1 : idxOfCurrentParagraph + 1];
      if (!nextParagraph && dir === BlockDirection.up) {
        const range = document.createRange();
        const node = items[0].box.node!;
        range.setStart(node, 0);
        range.setEnd(node, 0);
        selection.addRange(range);
        return;
      }
      if (!nextParagraph && dir === BlockDirection.down) {
        const range = document.createRange();
        const lastBox = tail(items).box;
        const node = lastBox.node!;
        range.setStart(node, lastBox.GetRenderedTextEndPosition());
        range.setEnd(node, lastBox.GetRenderedTextEndPosition());
        selection.addRange(range);
        return;
      }
      const itemsOfSiblingParagraph = view.layoutManager.getRTreeItemsByParagraph(nextParagraph);
      nextBox = dir === BlockDirection.up ? tail(itemsOfSiblingParagraph).box : itemsOfSiblingParagraph[0].box;
    } else {
      const nextItem = items[dir === BlockDirection.up ? boxIdx - 1 : boxIdx + 1];
      nextBox = nextItem.box;
    }
    DCHECK(nextBox);
    const idx = nextBox.GetTextPositionAtVisualLocation(x);
    const range = document.createRange();
    const node = nextBox.node!;
    range.setStart(node, idx);
    range.setEnd(node, idx);
    selection.addRange(range);
  }
}

class MoveBlockBackwardCommand extends MoveBlockCommand {
  constructor() {
    super({
      id: 'moveBlockBackward',
      kbOpts: {
        primary: KeyCode.UpArrow,
        args: BlockDirection.up,
      }
    });
  }
}

class MoveBlockForwardCommand extends MoveBlockCommand {
  constructor() {
    super({
      id: 'moveBlockForward',
      kbOpts: {
        primary: KeyCode.DownArrow,
        args: BlockDirection.down,
      }
    });
  }
}

registerTextEditorCommand(new MoveBlockBackwardCommand());
registerTextEditorCommand(new MoveBlockForwardCommand());
