import { DCHECK } from '../../../../../../base/check';
import { tail } from '../../../../../../base/common/array';
import { KeyCode, KeyMod } from '../../../../../../base/common/keyCodes';
import { ICanvas } from '../../../../../../canvas/canvas/canvas';
import { Editor, Element, Text, Transforms } from '../../editor';
import { registerTextEditorCommand, TextEditorCommand } from '../platform';

class Command extends TextEditorCommand {
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
}

registerTextEditorCommand(new Command());
