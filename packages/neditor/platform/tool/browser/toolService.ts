import {
  ITool,
  IToolService,
  IToolRegistry,
  Tool,
  IToolChangeEvnt,
} from '../common/tool';
import { Emitter } from '@neditor/core/base/common/event';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { Optional } from '@neditor/core/base/common/typescript';
import { registerSingleton } from '../../instantiation/common/extensions';
import { DCHECK } from '@neditor/core/base/check';
import { IInstantiationService } from '../../instantiation/common/instantiation';
import { SyncDescriptor } from '../../instantiation/common/descriptors';
import { Registry } from '../../registry/common/platform';
import { ICanvasService } from '../../canvas/common/canvas';
import { ToolController } from './toolController';
import { IKeyboardInputEvent, IMouseInputEvent, InputEvents, IWheelInputEvent } from '../../input/browser/event';

export class ToolService extends Disposable implements IToolService {
  _serviceBrand: undefined;
  private _onDidChangeTool = new Emitter<IToolChangeEvnt>();
  get onDidChangeTool() {
    return this._onDidChangeTool.event;
  }
  private _onWillChangeTool = new Emitter<IToolChangeEvnt>();
  get onWillChangeTool() {
    return this._onWillChangeTool.event;
  }

  private _controllers = new Map<ICanvas, ToolController>();
  private _currentController: Optional<ToolController>;

  constructor(
    @IInstantiationService private instantiationService: IInstantiationService,
    @ICanvasService private canvasService: ICanvasService,
  ) {
    super();

    this._register(canvasService.onDidActiveCanvasChange(canvas => {
      DCHECK(canvas);
      if (this._controllers.has(canvas)) return;
      this._attachCanvas(canvas);
    }));
  }

  switchBack(): void {
    this._currentController?.switchBack();
  }

  switchDefault(): void {
    const toolRegistry = Registry.as<IToolRegistry>(Tool);
    const defaultToolID = toolRegistry.getDefaultOne();
    if (this._currentController?.activeTool?.id === defaultToolID) return;
    this.switchTool(defaultToolID);
  }

  private _attachCanvas(canvas: ICanvas) {
    DCHECK(canvas);
    let cd = new ToolController(
      canvas,
      Registry.as<IToolRegistry>(Tool).values(),
      this._emitOnWillChangeToolEvent.bind(this),
      this._emitOnDidChangeToolEvent.bind(this),
    );

    this._controllers.set(canvas, cd);

    this._switchController(cd);
  }

  private _switchController(cd: ToolController) {
    DCHECK(cd);
    // const nextTool = cd.activeTool;
    // const currentTool = this._currentController?.activeTool;
    // if (nextTool || currentTool) this._emitOnWillChangeToolEvent(currentTool, nextTool);
    // if (this._currentController) {
    //   this._currentController.setActiveTool(undefined);
    // }
    //
    this._currentController = cd;
    // this._currentController.setActiveTool(nextTool);
    // this._emitOnDidChangeToolEvent(currentTool, nextTool);
  }

  private _emitOnWillChangeToolEvent(currentTool: Optional<ITool>, nextTool: Optional<ITool>) {
    this._onWillChangeTool.fire({
      prev: currentTool,
      next: nextTool,
    });
  }

  private _emitOnDidChangeToolEvent(currentTool: Optional<ITool>, nextTool: Optional<ITool>) {
    this._onDidChangeTool.fire({
      prev: currentTool,
      next: nextTool,
    });
  }

  switchTool(nextToolId: Optional<string>) {
    if (!this._currentController) return;
    const currentTool = this._currentController.activeTool;
    if (currentTool?.id === nextToolId) return;
    const nextTool = nextToolId ? this._currentController.createToolById(nextToolId) : undefined;
    this._currentController.setActiveTool(nextTool);
  }

  buttonPressed(event: IMouseInputEvent): boolean {
    return !!this._currentController?.buttonPressed(event);
  }
  buttonReleased(event: IMouseInputEvent): boolean {
    return !!this._currentController?.buttonReleased(event);
  }
  dbClick(event: IMouseInputEvent): boolean {
    return !!this._currentController?.dbClick(event);
  }
  dropCanceled(event: IMouseInputEvent): boolean {
    return !!this._currentController?.dropCanceled(event);
  }
  keyDown(event: IKeyboardInputEvent): boolean {
    return !!this._currentController?.keyDown(event);
  }
  keyUp(event: IKeyboardInputEvent): boolean {
    return !!this._currentController?.keyUp(event);
  }
  pointerMoved(event: IMouseInputEvent): boolean {
    return !!this._currentController?.pointerMoved(event);
  }
  wheelEvent(event: IWheelInputEvent): boolean {
    return !!this._currentController?.wheelEvent(event);
  }

  processEvent(e: InputEvents): boolean {
    return !!this._currentController?.processEvent(e);
  }
}

registerSingleton(IToolService, new SyncDescriptor(ToolService));
