import { DCHECK } from '../../../../../base/check';
import { tail } from '../../../../../base/common/array';
import { KeyCode, KeyMod } from '../../../../../base/common/keyCodes';
import { NOTREACHED } from '../../../../../base/common/notreached';
import { isNil } from '../../../../../base/common/type';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { ITextBoxRTreeItem } from '../../../../../engine/layout/r_tree';
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
    const lines = view.layoutManager.getContentOfParagraph(paragraph);
    DCHECK(lines.length > 0);
    let lineIndex: number | undefined;
    let x: number | undefined;
    // inline 可能会折行显示
    // 先找出所在的行
    for (const line of lines) {
      if (!isNil(lineIndex)) break;
      for (const item of line) {
        const textBox = item.box;
        if (textBox.node !== text) {
          continue;
        }
        const textStartPosition = textBox.GetVisualTextStartPosition();
        const textEndPosition = textBox.GetVisualTextEndPosition();
        if (textStartPosition > offset || textEndPosition < offset) continue;
        lineIndex = lines.indexOf(line);
        break;
      }
    }
    // 再找出 cursor 在当前行的显示位置
    DCHECK(lineIndex);
    let boxOffset = 0;
    for (const item of lines[lineIndex]) {
      const textBox = item.box;
      const textStartPosition = textBox.GetVisualTextStartPosition();
      const rect = textBox.RelativeRectOfSlice(textStartPosition, offset);
      x = rect.width + boxOffset;
      break;
    }
    DCHECK(x);
    let isFirstLine = lineIndex === 0;
    let isLastLine = lineIndex === lines.length - 1;
    let nextLine: ITextBoxRTreeItem[] = [];
    // 段首跳到上一个段落 or 段尾跳到下一个段落
    let jumpSiblingParagraph = isFirstLine && dir === BlockDirection.up || isLastLine && dir === BlockDirection.down;
    if (lines.length === 1) {
      DCHECK(jumpSiblingParagraph);
    }
    if (jumpSiblingParagraph) {
      const paragraphs = Array.from(pContainer.childNodes)
        .filter(n => n?.IsElement())
        .map(p => canvas.view.layoutManager.getParagraphOfNode(p!.firstChild!.firstChild!)!);
      const idxOfCurrentParagraph = paragraphs.indexOf(paragraph);
      const nextParagraph = paragraphs[dir === BlockDirection.up ? idxOfCurrentParagraph - 1 : idxOfCurrentParagraph + 1];
      if (!nextParagraph && dir === BlockDirection.up) {
        // 已到顶部，跳到整篇文字开头
        const range = document.createRange();
        const currentLine = lines[lineIndex];
        const firstInline = currentLine[0];
        const node = firstInline.box.node!;
        range.setStart(node, 0);
        range.setEnd(node, 0);
        selection.addRange(range);
        return;
      }
      if (!nextParagraph && dir === BlockDirection.down) {
        // 已到底部，跳到整篇文字结尾
        const range = document.createRange();
        const currentLine = lines[lineIndex];
        const lastInline = tail(currentLine);
        const lastBox = lastInline.box;
        const node = lastBox.node!;
        range.setStart(node, lastBox.GetVisualTextEndPosition());
        range.setEnd(node, lastBox.GetVisualTextEndPosition());
        selection.addRange(range);
        return;
      }
      const linesOfSiblingParagraph = view.layoutManager.getContentOfParagraph(nextParagraph);
      DCHECK(linesOfSiblingParagraph.length > 0);
      nextLine = dir === BlockDirection.up ? tail(linesOfSiblingParagraph) : linesOfSiblingParagraph[0];
    } else {
      nextLine = lines[dir === BlockDirection.up ? lineIndex - 1 : lineIndex + 1];
    }
    DCHECK(nextLine && nextLine.length);
    let usedWidth = 0;
    const range = document.createRange();
    for (const item of nextLine) {
      const box = item.box;
      const start = box.GetVisualTextStartPosition();
      const end = box.GetVisualTextEndPosition();
      const rect = box.RelativeRectOfSlice(start, end);
      if (usedWidth + rect.width < x) {
        usedWidth += rect.width;
        continue;
      }
      const pos = box.GetTextPositionAtVisualLocation(x - usedWidth);
      const node = box.node!;
      range.setStart(node, pos);
      range.setEnd(node, pos);
      selection.addRange(range);
      return;
    }
    // 上一行比这一行更长，导致无法精确匹配
    // 这时跳到最后一个 inline 最后
    {
      const lastItem = tail(nextLine);
      const box = lastItem.box;
      const end = box.GetVisualTextEndPosition();
      const node = box.node!;
      range.setStart(node, end);
      range.setEnd(node, end);
      selection.addRange(range);
    }
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
