import { Optional } from '@neditor/core/base/common/typescript';
import { IGenericRegistry } from '../../registry/common/genericRegistry';
import { createDecorator } from '../../instantiation/common/instantiation';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { Event } from '@neditor/core/base/common/event';
import { IKeyboardInputEvent, IMouseInputEvent, InputEvents, IWheelInputEvent } from '../../input/browser/event';
import { RawContextKey } from '../../contextkey/common/contextkey';
import { Button, parseButtonBits } from '../../../base/browser/mouseEvent';

export interface IStrokeTool extends ITool {
  beginPrimaryAction(event: InputEvents): void;
  continuePrimaryAction(event: InputEvents): void;
  endPrimaryAction(event: InputEvents): void;
}

export interface ITool {
  id: string;
  canvas: ICanvas;
  phase: ToolInvocationPhase;
  // onActivate: Event<string>;
  // onDidChangeCursor: Event<CursorStyle>;
  // onDidChangeSelection: Event<boolean>;

  processEvent(event: InputEvents): void;

  activate(): void;
  deactivate(): void;
  isStrokeTool(): this is IStrokeTool;
}

export interface IToolFactory<T extends ToolActivationShortcut = ToolActivationShortcut> {
  createTool(canvas: ICanvas): ITool;

  id: string;

  shortcut: T;
}

export const Tool = 'workbench.contributions.tool';

export abstract class ToolActivationShortcut {
  // 每次 activate 之后，是否只能触发一次
  once = false;
  isMouseShortcut(): this is MouseButtonShortcut {
    return false;
  }
  isCursorShortcut(): this is CursorShortcut {
    return false;
  }
  isDoubleClickShortcut() {
    return false;
  }
}

export class MouseButtonShortcut extends ToolActivationShortcut {
  type = ToolActivationType.MouseButtonType;
  buttons: Set<Button>;
  constructor(public readonly buttonsBit: number) {
    super();
    this.buttons = parseButtonBits(buttonsBit);
  }
  isMouseShortcut(): this is MouseButtonShortcut {
    return true;
  }
  /**
   * Reports whether the shortcut can transit form the "Ready"
   * to "Running" state. It means that the last button of the shortcut
   * is pressed.
   */
  matchBegin(button: number) {
    return this.buttons.has(button);
  }
}

export class CursorShortcut extends ToolActivationShortcut {
  type = ToolActivationType.MouseCursorType;
  isCursorShortcut(): this is CursorShortcut {
    return true;
  }
  match() {
    return true;
  }
}

export const CancelToolAction = 'tool.cancel';

export interface IToolRegistry extends IGenericRegistry<IToolFactory> {
  registerWithShortcut(factory: IToolFactory, asDefaultTool?: boolean): void;
  getDefaultOne(): Optional<string>;
}

export const IToolService = createDecorator<IToolService>('IToolService');

export enum ActionState {
  BEGIN, /**< Beginning an action */
  CONTINUE, /**< Continuing an action */
  END /**< Ending an action */
};

export interface IToolController {
  activeTool: Optional<ITool>;
  canvas: ICanvas;
  createToolById(toolId: string): Optional<ITool>;
  setActiveTool(tool: Optional<ITool>): boolean;
  setActiveToolById(toolId: string): boolean;
  switchBack(): void;
  // processEvent(e: InputEvents): void;

  buttonPressed(event: IMouseInputEvent): boolean;
  buttonReleased(event: IMouseInputEvent): boolean;
  dbClick(event: IMouseInputEvent): boolean;
  dropCanceled(event: IMouseInputEvent): boolean;
  wheelEvent(event: IWheelInputEvent): boolean;
  keyDown(event: IKeyboardInputEvent): boolean;
  keyUp(evt: IKeyboardInputEvent): boolean;
  pointerMoved(event: IMouseInputEvent): boolean;
}

export interface IToolService {
  _serviceBrand: undefined;

  switchTool(toolId: Optional<string>): void;
  switchBack(): void;
  switchDefault(): void;

  onWillChangeTool: Event<IToolChangeEvnt>;
  onDidChangeTool: Event<IToolChangeEvnt>;

  buttonPressed(event: IMouseInputEvent): boolean;
  buttonReleased(event: IMouseInputEvent): boolean;
  dbClick(event: IMouseInputEvent): boolean;
  dropCanceled(event: IMouseInputEvent): boolean;
  wheelEvent(event: IWheelInputEvent): boolean;
  keyDown(event: IKeyboardInputEvent): boolean;
  keyUp(evt: IKeyboardInputEvent): boolean;
  pointerMoved(event: IMouseInputEvent): boolean;
  processEvent(e: InputEvents): boolean;
}

export interface IToolChangeEvnt {
  prev: Optional<ITool>;
  next: Optional<ITool>;
}

export enum ToolInvocationPhase {
  noop,
  activated,
  runningPrimaryAction,
}

export namespace ToolContextKeys {
  export const currentToolState = new RawContextKey<ToolInvocationPhase>('ToolInvocationState', ToolInvocationPhase.noop);
}

export enum ToolActivationType {
  UnknownType, ///< Unknown, empty shortcut.
  KeyCombinationType, // < A list of keys that should be pressed.
  MouseCursorType, // 光标移动触发
  MouseButtonType, ///< A mouse button, possibly with key modifiers.
  MouseWheelType, ///< Mouse wheel movement, possibly with key modifiers.
  GestureType, ///< A touch gesture.
}

export enum GestureAction {
  NoGesture, ///< No gesture.
  OneFingerTap,
  TwoFingerTap,
  ThreeFingerTap,
  FourFingerTap,
  FiveFingerTap,
  OneFingerDrag,
  TwoFingerDrag,
  ThreeFingerDrag,
  FourFingerDrag,
  FiveFingerDrag,
  MaxGesture,
}
