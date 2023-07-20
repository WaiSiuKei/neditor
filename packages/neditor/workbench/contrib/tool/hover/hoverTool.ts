import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { IMouseInputEvent, InputEvents, InputEventType } from '@neditor/core/platform/input/browser/event';
import { BaseTool } from '@neditor/core/platform/tool/browser/baseTool';
import { CursorShortcut, ITool, IToolFactory } from '@neditor/core/platform/tool/common/tool';

class HoverTool extends BaseTool {
  get id(): string {
    return HoverToolID;
  }
  activate() {
    super.activate();
    this.resetCursorStyle();
  }
  deactivate() {
    super.deactivate();
    // this.canvas.view.setOutlines([]);
  }

  processEvent(event: InputEvents) {
    const { type } = event;
    // if (type === InputEventType.MOUSE_ENTER) {
    //   this.handleMouseEnter(event.asMouseInputEvent()!);
    //   event.accept();
    // } else if (type === InputEventType.MOUSE_LEAVE) {
    //   this.handleMouseLeave(event.asMouseInputEvent()!);
    //   event.accept();
    // }
    if (type === InputEventType.MOUSE_MOVE) {
      this.handleMouseMove(event.asMouseInputEvent()!);
      event.accept();
    }
    if (type === InputEventType.MOUSE_DOWN) {
      this.handlePointerDown(event.asMouseInputEvent()!);
      event.accept();
    }
  }

  // handleMouseEnter(e: IMouseInputEvent) {
  //   const { node } = tail(e.targetPath);
  //   const doc = this.canvas.view.document;
  //   if (node === doc.html() || node === doc.body()) {
  //     this.canvas.view.setOutlines([]);
  //     return;
  //   }
  //   const layoutObject = node.GetLayoutObject();
  //   if (layoutObject.AsLayoutTexes()) return;
  //   const { box } = layoutObject;
  //   const size = box.content_box_size();
  //   const paddingTop = box.padding_top().toFloat();
  //   const paddingRight = box.padding_right().toFloat();
  //   const paddingBottom = box.padding_bottom().toFloat();
  //   const paddingLeft = box.padding_left().toFloat();
  //   const width = size.width().toFloat() + paddingLeft + paddingRight;
  //   const height = size.height().toFloat() + paddingTop + paddingBottom;
  //   const offset = box.GetBorderBoxOffsetFromRoot(true);
  //   const top = offset.y().toFloat();
  //   const left = offset.x().toFloat();
  //   this.canvas.view.setOutlines([{
  //     top,
  //     left,
  //     width,
  //     height
  //   }]);
  // }

  // handleMouseLeave(e: IMouseInputEvent) {
  //   // const { node } = tail(e.targetPath);
  //   // console.log('mouse leave', virtualDOMNode?.nodeName);
  // }

  handleMouseMove(e: IMouseInputEvent) {
    const hitElement = this.canvas.getElementAtPosition(e.clientX, e.clientY);

    if (hitElement) {
      this.canvas.view.setCursor(CursorStyle.move);
    } else {
      this.canvas.view.setCursor(CursorStyle.arrow);
    }
  }

  handlePointerDown(e: IMouseInputEvent) {
    const selectedElements = this.canvas.selectedElements;
    const hitElement = this.canvas.getElementAtPosition(e.clientX, e.clientY);
    if (hitElement && selectedElements.length === 1 && hitElement === selectedElements[0]) {
      return;
    }
    if (hitElement) {
      this.canvas.setSelectedElements([hitElement]);
    } else {
      this.canvas.setSelectedElements([]);
    }
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
