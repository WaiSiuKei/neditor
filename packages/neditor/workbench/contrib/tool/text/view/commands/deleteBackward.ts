import { KeyCode } from '../../../../../../base/common/keyCodes';
import { ICanvas } from '../../../../../../canvas/canvas/canvas';
import { Editor, Range, } from '../../editor';
import { registerTextEditorCommand, TextEditorCommand } from '../platform';

class Command extends TextEditorCommand {
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
    const { selection } = editor;
    if (selection && Range.isExpanded(selection)) {
      Editor.deleteFragment(editor, { direction: 'backward' });
    } else {
      Editor.deleteBackward(editor);
    }
  }
}

registerTextEditorCommand(new Command());
