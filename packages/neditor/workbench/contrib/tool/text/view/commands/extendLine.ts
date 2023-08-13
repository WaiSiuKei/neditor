import { KeyCode, KeyMod } from '../../../../../../base/common/keyCodes';
import { ICanvas } from '../../../../../../canvas/canvas/canvas';
import { Editor, Transforms } from '../../editor';
import { registerTextEditorCommand, TextEditorCommand } from '../platform';

class ExtendLineBackwardCommand extends TextEditorCommand {
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
}

class ExtendLineForwardCommand extends TextEditorCommand {
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
}

registerTextEditorCommand(new ExtendLineBackwardCommand());
registerTextEditorCommand(new ExtendLineForwardCommand());
