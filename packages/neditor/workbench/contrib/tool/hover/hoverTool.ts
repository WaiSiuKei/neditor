import { CursorShortcut, ITool, IToolFactory } from '@neditor/core/platform/tool/common/tool';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { BaseTool } from '@neditor/core/platform/tool/browser/baseTool';
import { IMouseInputEvent, InputEvents, InputEventType } from '@neditor/core/platform/input/browser/event';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { tail } from '../../../../base/common/array';

class HoverTool extends BaseTool {
  get id(): string {
    return HoverToolID;
  }
  activate() {
    super.activate();
    this.resetCursorStyle()
  }
  deactivate() {
    super.deactivate();
    this.canvas.view.setOutlines([]);
  }

  processEvent(event: InputEvents) {
    const { type } = event;
    if (type === InputEventType.MOUSE_ENTER) {
      this.handleMouseEnter(event.asMouseInputEvent()!);
      event.accept();
    } else if (type === InputEventType.MOUSE_LEAVE) {
      this.handleMouseLeave(event.asMouseInputEvent()!);
      event.accept();
    }
  }

  handleMouseEnter(e: IMouseInputEvent) {
    const { node } = tail(e.targetPath);
    const doc = this.canvas.view.document;
    if (node === doc.html() || node === doc.body()) {
      this.canvas.view.setOutlines([]);
      return;
    }
    const layoutObject = node.GetLayoutObject();
    if (layoutObject.AsLayoutTexes()) return;
    const { box } = layoutObject;
    const size = box.content_box_size();
    const width = size.width().toFloat();
    const height = size.height().toFloat();
    const offset = box.GetBorderBoxOffsetFromRoot(true);
    const top = offset.y().toFloat();
    const left = offset.x().toFloat();
    this.canvas.view.setOutlines([{
      top,
      left,
      width,
      height
    }]);
  }

  handleMouseLeave(e: IMouseInputEvent) {
    // const { node } = tail(e.targetPath);
    // console.log('mouse leave', virtualDOMNode?.nodeName);
  }
}

export const HoverToolID = 'tool.hover';

export class HoverToolFactory implements IToolFactory {
  id = HoverToolID;
  createTool(canvas: ICanvas): ITool {
    return new HoverTool(canvas, CursorStyle.arrow);
  }
  shortcut = new CursorShortcut();
}
