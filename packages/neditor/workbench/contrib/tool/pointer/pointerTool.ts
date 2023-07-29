import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { IMouseInputEvent, InputEvents, InputEventType } from '@neditor/core/platform/input/browser/event';
import { BaseTool } from '@neditor/core/platform/tool/browser/baseTool';
import { CursorShortcut, ITool, IToolFactory } from '@neditor/core/platform/tool/common/tool';
import { toPX } from '../../../../base/browser/css';
import { DCHECK } from '../../../../base/check';
import { Optional } from '../../../../base/common/typescript';
import { ScopedIdentifier } from '../../../../canvas/canvasCommon/scope';
import { getScopedIdentifier } from '../../../../canvas/viewModel/path';
import { BlockNodeModelProxy, isBlockNodeModelProxy } from '../../../../common/node';

class PointerTool extends BaseTool {
  get id(): string {
    return PointerToolID;
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
    if (type === InputEventType.MOUSE_MOVE && !this.dragging) {
      this.handleMouseMove(event.asMouseInputEvent()!);
      event.accept();
    }
    if (type === InputEventType.MOUSE_DOWN) {
      this.handlePointerDown(event.asMouseInputEvent()!);
      event.accept();
    }
    if (type === InputEventType.DRAG_START) {
      this.handleDragStart(event.asMouseInputEvent()!);
      event.accept();
    }
    if (type === InputEventType.DRAG) {
      this.handleDrag(event.asMouseInputEvent()!);
      event.accept();
    }
    if (type === InputEventType.DROP) {
      this.handleDrop();
      event.accept();
    }
    if (type === InputEventType.DRAG_END) {
      this.handleDragEnd();
      event.accept();
    }
  }

  handleMouseMove(e: IMouseInputEvent) {
    const hitElement = this.canvas.getElementAtPosition(e.clientX, e.clientY);

    if (hitElement) {
      this.canvas.view.setCursor(CursorStyle.move);
    } else {
      this.canvas.view.setCursor(CursorStyle.arrow);
    }
  }

  selected: ScopedIdentifier[] = [];
  handlePointerDown(e: IMouseInputEvent) {
    const selectedElements = this.canvas.selectedElements;
    const hitElement = this.canvas.getElementAtPosition(e.clientX, e.clientY);
    if (hitElement && selectedElements.length === 1 && hitElement === selectedElements[0]) {
      return;
    }
    if (hitElement) {
      this.selected.push(getScopedIdentifier(hitElement));
      this.canvas.setSelectedElements([hitElement]);
    } else {
      this.selected.length = 0;
      this.canvas.setSelectedElements([]);
    }
  }

  from: Map<ScopedIdentifier, {
    node: BlockNodeModelProxy,
    x: number,
    y: number,
  }> = new Map;
  startX: Optional<number>;
  startY: Optional<number>;
  dragging = false;
  handleDragStart(e: IMouseInputEvent) {
    this.dragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.from.clear();
    this.canvas.setSelectedElements([]);
    this.selected.forEach(sid => {
      const model = this.canvas.getScopedModel(sid.scope);
      const node = model.getNodeById(sid.id);
      DCHECK(node);
      DCHECK(isBlockNodeModelProxy(node));
      this.from.set(sid, {
        node,
        x: parseInt(node.style.marginLeft || ''),
        y: parseInt(node.style.marginTop || ''),
      });
    });
  }

  handleDrag(e: IMouseInputEvent) {
    const { clientX, clientY } = e;
    DCHECK(this.startX);
    DCHECK(this.startY);
    const deltaX = clientX - this.startX;
    const deltaY = clientY - this.startY;
    this.canvas.transform(() => {
      for (let item of this.from.values()) {
        const { node, x, y } = item;
        node.style.marginLeft = toPX(x + deltaX);
        node.style.marginTop = toPX(y + deltaY);
      }
    });
  }

  handleDrop() {
    this.startX = undefined;
    this.startY = undefined;
    this.dragging = false;
    this.canvas.setSelectedElements(Array.from(this.from.keys()).map(sid => {
      return this.canvas.view.document.getElementById(sid.id)!;
    }));
    this.from.clear();
  }

  handleDragEnd() {
    this.startX = undefined;
    this.startY = undefined;
    this.dragging = false;
    this.from.clear();
  }
}

export const PointerToolID = 'tool.pointer';

export class PointerToolFactory implements IToolFactory {
  id = PointerToolID;
  createTool(canvas: ICanvas): ITool {
    return new PointerTool(canvas, CursorStyle.arrow);
  }
  shortcut = new CursorShortcut();
}
