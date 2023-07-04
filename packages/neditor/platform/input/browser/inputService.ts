import { IToolService } from '../../tool/common/tool';
import { IInputService } from '../common/inputService';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { registerSingleton } from '../../instantiation/common/extensions';
import { SyncDescriptor } from '../../instantiation/common/descriptors';
import { InputEventType, InputEvents } from './event';
import { Disposable } from '../../../base/common/lifecycle';
import { IKeybindingService } from '../../keybinding/common/keybinding';
import { assertValue } from '../../../base/common/type';
import { NOTIMPLEMENTED } from '../../../base/common/notreached';
import { IContextKeyService } from '../../contextkey/common/contextkey';
import { CanvasContextKeys } from '../../../canvas/canvas/canvasContextKeys';

export class InputService extends Disposable implements IInputService {
  _serviceBrand: undefined;

  constructor(
    @IToolService private toolService: IToolService,
    @IKeybindingService private keybindingService: IKeybindingService,
    @IContextKeyService private contextKeyService: IContextKeyService,
  ) {
    super();
  }

  addTrackedCanvas(canvas: ICanvas): void {
    canvas.installEventFilter(this);
  }

  removeTrackedCanvas(canvas: ICanvas): void {
    NOTIMPLEMENTED();
  }

  eventFilter(event: InputEvents): boolean {
    switch (event.type) {
      case InputEventType.MOUSE_DOWN: {
        let mouseEvent = event.asMouseInputEvent();
        assertValue(mouseEvent);
        if (this.toolService.buttonPressed(mouseEvent)) {
          event.accept()
        }
        break;
      }
      case InputEventType.MOUSE_UP: {
        let mouseEvent = event.asMouseInputEvent();
        assertValue(mouseEvent);
        if (this.toolService.buttonReleased(mouseEvent)) {
          event.accept()
        }
        break;
      }
      case InputEventType.DBLCLICK: {
        let mouseEvent = event.asMouseInputEvent();
        assertValue(mouseEvent);
        if (this.toolService.dbClick(mouseEvent)) {
          event.accept();
        }
        break;
      }
      case InputEventType.DRAG_END: {
        let mouseEvent = event.asMouseInputEvent();
        assertValue(mouseEvent);
        if (this.toolService.dropCanceled(mouseEvent)) {
          event.accept()
        }
        break;
      }
      case InputEventType.MOUSE_MOVE:
        if (this.toolService.pointerMoved(event.asMouseInputEvent()!)) {
          event.accept()
          return true;
        }
        break;
      case InputEventType.WHEEL: {
        let wheelEvent = event.asWheelInputEvent();
        assertValue(wheelEvent);
        if (this.toolService.wheelEvent(wheelEvent)) {
          event.accept()
        }
        break;
      }
      case InputEventType.KEY_UP:
        const isTextEditing = this.contextKeyService.getContextKeyValue<boolean>(CanvasContextKeys.isEditingText.key);
        if (!isTextEditing && this.keybindingService.dispatchEvent(event.asKeyboardInputEvent()!.init, document.body)) {
          event.accept()
        }
        break;
    }
    if (!event.isAccepted()) {
      this.toolService.processEvent(event);
    }
    return event.isAccepted();
  }
}

registerSingleton(IInputService, new SyncDescriptor(InputService));

