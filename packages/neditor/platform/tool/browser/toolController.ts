import { Optional } from '@neditor/core/base/common/typescript';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { DCHECK } from '../../../base/check';
import { KeyCode } from '../../../base/common/keyCodes';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../base/common/notreached';
import { assertValue } from '../../../base/common/type';
import { DLOG, INFO, WARNING } from '../../../base/logging';
import { IKeyboardInputEvent, IMouseInputEvent, InputEvents, InputEventType, IWheelInputEvent } from '../../input/browser/event';
import { ActionState, ITool, IToolController, IToolFactory, ToolInvocationPhase } from '../common/tool';

function DEBUG_LOG(...args: any[]) {
  // console.log(...args);
}

export class ToolController implements IToolController {
  private _activeTool: Optional<ITool>;
  private _past: string[] = [];

  private _recursiveCounter = 0;
  private _brokenByRecursion = 0;
  private _keys = new Set<KeyCode>();
  private _buttons = new Set<number>();

  constructor(
    public canvas: ICanvas,
    private toolFactories: IToolFactory[],
    private onWillChangeTool: (current: Optional<ITool>, next: Optional<ITool>) => void,
    private onDidChangeTool: (current: Optional<ITool>, next: Optional<ITool>) => void,
  ) {
  }

  createToolById(toolId: string): Optional<ITool> {
    let toolShortcut = this.toolFactories.find(t => t.id === toolId);
    if (!toolShortcut) return undefined;
    return toolShortcut.createTool(this.canvas);
  }

  getShortcutById(toolId: string): Optional<IToolFactory> {
    return this.toolFactories.find(s => s.id === toolId);
  }

  setActiveToolById(id: string): boolean {
    if (this._activeTool?.id === id) return false;
    const tool = this.createToolById(id);
    if (!tool) return false;
    return this.setActiveTool(tool);
  }

  switchBack() {
    const lastOne = this._past.pop();
    if (lastOne) {
      this.setActiveToolById(lastOne);
      this._past.pop();
    } else {
      this.setActiveTool(undefined);
    }
  }

  get activeTool() {
    return this._activeTool;
  }

  setActiveTool(nextTool: Optional<ITool>): boolean {
    if (nextTool?.id === this._activeTool?.id) return false;
    const currentTool = this._activeTool;
    this.onWillChangeTool(currentTool, nextTool);
    if (this._activeTool) this._deactivateTool(this._activeTool);
    this._doSetActiveTool(nextTool);
    if (nextTool) this._activateTool(nextTool);
    this.onDidChangeTool(currentTool, nextTool);
    return !!this._activeTool;
  }

  private _deactivateTool(tool: ITool) {
    if (tool.phase !== ToolInvocationPhase.noop) {
      tool.deactivate();
    }
    tool.phase = ToolInvocationPhase.noop;
  }

  private _activateTool(tool: ITool) {
    tool.activate();
    tool.phase = ToolInvocationPhase.activated;
  }

  private _beginTool(event: InputEvents) {
    this._forwardEvent(ActionState.BEGIN, event);
    this._activeTool!.phase = ToolInvocationPhase.runningPrimaryAction;
  }

  private _continueTool(event: InputEvents) {
    this._forwardEvent(ActionState.CONTINUE, event);
  }

  private _endTool(event: InputEvents) {
    this._forwardEvent(ActionState.END, event);
  }

  private _doSetActiveTool(tool: Optional<ITool> = undefined) {
    if (this._activeTool) {
      this._past.push(this._activeTool.id);
    }
    this._activeTool = tool;
  }

  processEvent(e: InputEvents) {
    if (this._activeTool) {
      this._activeTool.processEvent(e);
    }
    return e.isAccepted();
  }

  private _forwardEvent(state: ActionState, event: InputEvents): boolean {
    let retval = true;
    const mouseEvent = event.asMouseInputEvent();
    if (mouseEvent) {
      mouseEvent.accept();
      this._forwardToTool(state, event);
    }

    return retval;
  }

  private _forwardToTool(state: ActionState, ev: InputEvents) {
    if (!this._activeTool) return;
    if (!this._activeTool.isStrokeTool()) NOTREACHED();

    switch (state) {
      case ActionState.BEGIN:
        if (ev.type == InputEventType.DBLCLICK) {
          NOTIMPLEMENTED();
          // this._activeTool.beginPrimaryDoubleClickAction(ev);
        } else {
          this._activeTool.beginPrimaryAction(ev);
        }
        break;
      case ActionState.CONTINUE:
        this._activeTool.continuePrimaryAction(ev);
        break;
      case ActionState.END:
        this._activeTool.endPrimaryAction(ev);
        break;
    }
  }

  withRecursionNotifier<R>(cb: () => R): R {
    this._recursiveCounter++;
    this._brokenByRecursion++;
    try {
      return cb();
    } finally {
      this._recursiveCounter--;
    }
  }
  isInRecursion(): boolean {
    return this._recursiveCounter > 1;
  }
  withRecursionGuard<R>(cb: () => R): R {
    this._brokenByRecursion = 0;
    try {
      return cb();
    } finally {
    }
  }
  isBrokenByRecursion() {
    return this._brokenByRecursion > 0;
  }

  buttonPressed(event: IMouseInputEvent): boolean {
    return this.withRecursionNotifier(() => {
      let retval = false;
      if (this._buttons.has(event.buttons)) {
        DLOG(INFO, 'Peculiar, button was already pressed.');
      }

      this._buttons.add(event.buttons);

      if (!this.activeTool) return false;
      if (this.activeTool.phase !== ToolInvocationPhase.runningPrimaryAction && !this.isInRecursion()) {
        const factory = this.getShortcutById(this.activeTool.id);
        assertValue(factory);
        if (factory.shortcut.isMouseShortcut()) {
          DEBUG_LOG('begin tool');
          this.withRecursionGuard(() => {
            this._beginTool(event);
            retval = true;

            if (this.isBrokenByRecursion()) {
              NOTIMPLEMENTED();
              this._forceDeactivateAllActions();
            }
          });
        }
      }

      if (this.isInRecursion()) {
        NOTREACHED();
        this._forceDeactivateAllActions();
      }
      return retval;
    });
  }
  buttonReleased(event: IMouseInputEvent): boolean {
    return this.withRecursionNotifier(() => {
      let retval = false;

      if (this.activeTool) {
        retval = this._tryEndRunningTool(event);
      }

      if (!this._buttons.has(event.buttons)) {
        this.reset();
        DLOG(INFO, `Peculiar, button released but we can't remember it was pressed`);
      } else {
        this._buttons.delete(event.buttons);
      }

      if (this.isInRecursion()) {
        this._forceDeactivateAllActions();
      } else if (!this.activeTool) {
        // if (!this.readyTool) {
        //   this._prepareReadyTools();
        //   this._tryActivateReadyTool();
        // }
      }

      return retval;
    });
  }
  dbClick(event: IMouseInputEvent): boolean {
    return this.withRecursionNotifier(() => {
      if (this.isInRecursion()) {
        NOTIMPLEMENTED();
      }

      this.processEvent(event);
      if (event.isAccepted()) {
        return true;
      }

      if (this.isInRecursion()) {
        NOTIMPLEMENTED();
      }
      return this._tryRunDoubleClickTool(event);
    });
    // return this.processEvent(event);
  }
  dropCanceled(event: IMouseInputEvent): boolean {
    return false;
    // return this.buttonReleased(event);
  }
  wheelEvent(event: IWheelInputEvent) {
    return false;
    // return this.withRecursionNotifier(() => {
    //   if (this.runningShortcut || this.isUsingTouch() || this.isInRecursion()) {
    //     // ("Wheel event canceled.");
    //     return false;
    //   }
    //   return this._tryRunSingleActionShortcut(wheelAction, event, this.keys);
    // });
  }
  keyDown(event: IKeyboardInputEvent): boolean {
    return this.withRecursionNotifier(() => {
      let retval = false;

      if (this._keys.has(event.keyCode)) {
        DLOG(INFO, 'Peculiar, records show key was already pressed');
      }

      return retval;
    });
  }
  keyUp(evt: IKeyboardInputEvent): boolean {
    return this.withRecursionNotifier(() => {
      if (!this._keys.has(evt.keyCode)) {
        DLOG(WARNING, 'Peculiar, key released but can\'t remember it was pressed');
      }
      this._keys.delete(evt.keyCode);

      return false;
    });
  }
  pointerMoved(event: IMouseInputEvent): boolean {
    return this.withRecursionNotifier(() => {
      if (this.isInRecursion()) {
        NOTIMPLEMENTED();
      }

      // DEBUG_LOG('mousemove')

      if (this._activeTool) {
        if (this._activeTool.isStrokeTool() && this._activeTool.phase === ToolInvocationPhase.runningPrimaryAction) {
          this._continueTool(event);
          return true;
        } else {
          return this.processEvent(event);
        }
      }

      return this._tryRunCursorTool(event);
    });
  }

  private _forceDeactivateAllActions() {
    if (this.activeTool) {
      this._deactivateTool(this.activeTool);
      DEBUG_LOG('forceDeactivateAllActions');
    }
  }

  private _tryEndRunningTool(event: InputEvents) {
    if (!this.activeTool) NOTREACHED();
    if (this.activeTool.phase === ToolInvocationPhase.noop) {
      NOTREACHED();
    }

    let canBeTerminated = false;
    const s = this.getShortcutById(this.activeTool.id);
    assertValue(s);
    const { shortcut } = s;

    if (event.isMouseInputEvent()) {
      if (shortcut.isMouseShortcut()) {
        canBeTerminated = shortcut.matchBegin(event.buttons);
      } else if (shortcut.isCursorShortcut()) {
        canBeTerminated = !event.buttons;
      }
    } else if (event.isKeyboardInputEvent()) {
      canBeTerminated = true;
    }

    if (canBeTerminated) {
      // first reset running shortcut to avoid infinite recursion via end()
      const lifecycleEnded = shortcut.once;
      DCHECK(this._activeTool);
      if (lifecycleEnded) {
        this._activeTool.phase === ToolInvocationPhase.noop;
        DEBUG_LOG('Ending running shortcut at event', event);
        this.setActiveTool(undefined);
      } else {
        if (shortcut.isMouseShortcut()) {
          this._endTool(event);
          this._activeTool.phase = ToolInvocationPhase.activated;
        }
      }
    }

    return !this.activeTool;
  }

  private _tryRunCursorTool(event: IMouseInputEvent): boolean {
    let goodCandidate: Optional<IToolFactory>;
    this.toolFactories.forEach(s => {
      const { shortcut } = s;
      if (shortcut.isCursorShortcut()) {
        // FIXME: 应该只有一个
        goodCandidate = s;
      }
    });

    if (goodCandidate) {
      DEBUG_LOG('activate', goodCandidate.id);
      this.setActiveToolById(goodCandidate.id);

      this.withRecursionGuard(() => {
        assertValue(goodCandidate);
        this.processEvent(event);

        // the tool migh have opened some dialog, which could break our event loop
        if (this.isBrokenByRecursion()) {
          NOTIMPLEMENTED();
        }
      });
    }

    return !!goodCandidate;
  }

  private _tryRunDoubleClickTool(event: IMouseInputEvent): boolean {
    const candidates = this.toolFactories.filter(f => f.shortcut.isDoubleClickShortcut());
    if (!candidates.length) return false;

    let goodCandidate = candidates[0];
    DEBUG_LOG('activate double click', goodCandidate.id);
    this.setActiveToolById(goodCandidate.id);

    this.withRecursionGuard(() => {
      assertValue(goodCandidate);
      this.processEvent(event);

      // the tool migh have opened some dialog, which could break our event loop
      if (this.isBrokenByRecursion()) {
        NOTIMPLEMENTED();
      }
    });

    return !!goodCandidate;
  }

  private reset() {
    this._keys.clear();
    this._buttons.clear();
  }
}
