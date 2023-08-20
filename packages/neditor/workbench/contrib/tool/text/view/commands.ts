import { DCHECK } from '../../../../../base/check';
import { tail } from '../../../../../base/common/array';
import { KeyCode, KeyMod } from '../../../../../base/common/keyCodes';
import { NOTREACHED } from '../../../../../base/common/notreached';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { TextBox } from '../../../../../engine/layout/text_box';
import { Editor, Element, Range, Text, Transforms } from '../editor';
import { registerTextEditorCommand, TextEditorCommand } from './platform';

registerTextEditorCommand(new class SplitBlockCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'splitBlock',
      kbOpts: {
        primary: KeyCode.Enter
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    canvas.transform(() => {
      Editor.insertBreak(editor);
      // 不然怪怪的
      canvas.model.removeEmptyTextNodes();
    });
  }
});
registerTextEditorCommand(new class DeleteBackwardCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'deleteBackward',
      kbOpts: {
        primary: KeyCode.Backspace,
        secondary: [KeyCode.Delete],
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    canvas.transform(() => {
      const { selection } = editor;
      if (selection && Range.isExpanded(selection)) {
        Editor.deleteFragment(editor, { direction: 'backward' });
      } else {
        Editor.deleteBackward(editor);
      }
    });
  }
});
registerTextEditorCommand(new class ExtendLineBackwardCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'extendLineBackward',
      kbOpts: {
        primary: KeyCode.LeftArrow | KeyMod.Shift
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    Transforms.move(editor, {
      unit: 'line',
      edge: 'focus',
      reverse: true,
    });
  }
});
registerTextEditorCommand(new class ExtendLineForwardCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'extendLineForward',
      kbOpts: {
        primary: KeyCode.RightArrow | KeyMod.Shift
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    Transforms.move(editor, { unit: 'line', edge: 'focus' });
  }
});
registerTextEditorCommand(new class MoveBackwardCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'moveBackward',
      kbOpts: {
        primary: KeyCode.LeftArrow
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    const { selection } = editor;
    const isRTL = false;
    if (selection && Range.isCollapsed(selection)) {
      Transforms.move(editor, { reverse: !isRTL });
    } else {
      Transforms.collapse(editor, { edge: 'start' });
    }
  }
});
registerTextEditorCommand(new class MoveForwardCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'moveForward',
      kbOpts: {
        primary: KeyCode.RightArrow
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    const { selection } = editor;
    const isRTL = false;
    if (selection && Range.isCollapsed(selection)) {
      Transforms.move(editor, { reverse: isRTL });
    } else {
      Transforms.collapse(editor, { edge: 'end' });
    }
  }
});
registerTextEditorCommand(new class SelectAllCommand extends TextEditorCommand {
  constructor() {
    super({
      id: 'selectAll',
      kbOpts: {
        primary: KeyMod.CtrlCmd | KeyCode.KEY_A
      }
    });
  }
  runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void> {
    const lastParagrapn = tail(editor.children);
    DCHECK(Element.isElement(lastParagrapn));
    const lastSpan = tail(lastParagrapn.children);
    DCHECK(Text.isText(lastSpan));
    const range = {
      anchor: {
        path: [0, 0],
        offset: 0,
      },
      focus: {
        path: [editor.children.length - 1, lastParagrapn.children.length - 1],
        offset: lastSpan.content.length,
      },
    };

    // Update the selection with the new range
    Transforms.select(editor, range);
  }
});
//#region move block
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
      const textStartPosition = textBox.GetVisualTextStartPosition();
      const textEndPosition = textBox.GetVisualTextEndPosition();
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
        range.setStart(node, lastBox.GetVisualTextEndPosition());
        range.setEnd(node, lastBox.GetVisualTextEndPosition());
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
registerTextEditorCommand(new class MoveBlockBackwardCommand extends MoveBlockCommand {
  constructor() {
    super({
      id: 'moveBlockBackward',
      kbOpts: {
        primary: KeyCode.UpArrow,
        args: BlockDirection.up,
      }
    });
  }
});
registerTextEditorCommand(new class MoveBlockForwardCommand extends MoveBlockCommand {
  constructor() {
    super({
      id: 'moveBlockForward',
      kbOpts: {
        primary: KeyCode.DownArrow,
        args: BlockDirection.down,
      }
    });
  }
});
//#endregion
