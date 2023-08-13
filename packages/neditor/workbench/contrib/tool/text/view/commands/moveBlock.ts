import { DCHECK } from '../../../../../../base/check';
import { KeyCode } from '../../../../../../base/common/keyCodes';
import { NOTREACHED } from '../../../../../../base/common/notreached';
import { ICanvas } from '../../../../../../canvas/canvas/canvas';
import { Editor, Range, Transforms } from '../../editor';
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

    const paragraph = view.layoutManager.getParagraphOfNode(text);
    if (!paragraph) NOTREACHED();
    const items = view.layoutManager.getRTreeItemsByParagraph(paragraph);
    let boxIdx: number | undefined;
    let x: number | undefined;
    items.forEach((item, i) => {
      const textBox = item.box;
      const textStartPosition = textBox.GetRenderedTextStartPosition();
      const textEndPosition = textBox.GetRenderedTextEndPosition();
      if (textStartPosition > offset || textEndPosition < offset) return;
      const rect = textBox.RelativeRectOfSlice(offset, offset);
      x = rect.x;
      boxIdx = i;
    });
    DCHECK(boxIdx);
    DCHECK(x);
    console.log(boxIdx, x);
    if (boxIdx === 0 && dir === BlockDirection.up) {
      return;
    }
    if (boxIdx === items.length - 1 && dir === BlockDirection.down) {
      return;
    }
    const nextItem = items[dir === BlockDirection.up ? boxIdx - 1 : boxIdx + 1];
    const idx = nextItem.box.GetTextPositionAtVisualLocation(x);
    const range = document.createRange();
    const node = nextItem.box.node!;
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
