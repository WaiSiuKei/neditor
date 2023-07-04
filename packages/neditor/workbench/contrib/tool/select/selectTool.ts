import { ITool, IToolFactory, MouseButtonShortcut } from '@neditor/core/platform/tool/common/tool';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { BaseTool } from '@neditor/core/platform/tool/browser/baseTool';
import { InputEventType, IMouseInputEvent, InputEvents } from '@neditor/core/platform/input/browser/event';
import { tail } from '@neditor/core/base/common/array';
import { assertIsDefined } from '@neditor/core/base/common/type';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Range } from '@neditor/core/engine/dom/range';
import { Document } from '@neditor/core/engine/dom/document';
import { Optional } from '@neditor/core/base/common/typescript';
import { LayoutUnit } from '@neditor/core/engine/layout/layout_unit';
import { Buttons } from '../../../../base/browser/mouseEvent';

class SelectTool extends BaseTool implements ITool {
  get id(): string {
    return SelectToolID;
  }
  activate() {
    super.activate();
  }
  deactivate() {
    super.deactivate();
  }
}

export const SelectToolID = 'tool.select';

export class SelectToolFactory implements IToolFactory {
  id = SelectToolID;
  shortcut = new MouseButtonShortcut(Buttons.Primary);
  createTool(canvas: ICanvas): ITool {
    return new SelectTool(canvas, CursorStyle.arrow);
  }
}
