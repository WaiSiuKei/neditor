import { KeyCode } from '../../../../../../base/common/keyCodes';
import { ICanvas } from '../../../../../../canvas/canvas/canvas';
import { Editor, Range, Transforms } from '../../editor';
import { registerTextEditorCommand, TextEditorCommand } from '../platform';

class MoveBackwardCommand extends TextEditorCommand {
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
}

class MoveForwardCommand extends TextEditorCommand {
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
}

registerTextEditorCommand(new MoveBackwardCommand());
registerTextEditorCommand(new MoveForwardCommand());

