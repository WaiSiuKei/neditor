import { Disposable } from '@neditor/core/base/common/lifecycle';
import { IKeybindingService } from './keybinding';
import { ICommandService } from '@neditor/core/platform/commands/common/commands';
import { Keybinding, ResolvedKeybinding } from '@neditor/core/base/common/keyCodes';
import { IKeyboardEvent } from '@neditor/core/base/browser/keyboardEvent';
import { IResolveResult, KeybindingResolver } from './keybindingResolver';
import { ResolvedKeybindingItem } from './resolvedKeybindingItem';
import { IContextKeyService, IContextKeyServiceTarget } from '../../contextkey/common/contextkey';
import { ILogService } from "../../log/common/log";
import { coalesce } from "../../../base/common/array";

export abstract class AbstractKeybindingService extends Disposable implements IKeybindingService {
  public _serviceBrand: undefined;

  // protected readonly _onDidUpdateKeybindings: Emitter<IKeybindingEvent> = this._register(new Emitter<IKeybindingEvent>());
  // get onDidUpdateKeybindings(): Event<IKeybindingEvent> {
  //   return this._onDidUpdateKeybindings ? this._onDidUpdateKeybindings.event : Event.None; // Sinon stubbing walks properties on prototype
  // }


  constructor(
    private _contextKeyService: IContextKeyService,
    protected _commandService: ICommandService,
  ) {
    super();
  }

  public dispose(): void {
    super.dispose();
  }

  protected abstract _getResolver(): KeybindingResolver;
  protected abstract _documentHasFocus(): boolean;
  public abstract resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[];
  public abstract resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding;

  public getDefaultKeybindingsContent(): string {
    return '';
  }

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._getResolver().getDefaultKeybindings();
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._getResolver().getKeybindings();
  }

  public customKeybindingsCount(): number {
    return 0;
  }

  public lookupKeybindings(commandId: string): ResolvedKeybinding[] {
    return coalesce(
      this._getResolver().lookupKeybindings(commandId).map(item => item.resolvedKeybinding)
    );
  }

  public lookupKeybinding(commandId: string): ResolvedKeybinding | undefined {
    const result = this._getResolver().lookupPrimaryKeybinding(commandId);
    if (!result) {
      return undefined;
    }
    return result.resolvedKeybinding;
  }

  public dispatchEvent(e: IKeyboardEvent, target: IContextKeyServiceTarget): boolean {
    return this._dispatch(e, target);
  }

  public softDispatch(e: IKeyboardEvent, target: IContextKeyServiceTarget): IResolveResult | null {
    const keybinding = this.resolveKeyboardEvent(e);
    const [firstPart] = keybinding.getDispatchParts();
    if (firstPart === null) {
      // cannot be dispatched, probably only modifier keys
      return null;
    }

    const contextValue = this._contextKeyService.getContext(target);
    return this._getResolver().resolve(contextValue, firstPart);
  }

  protected _dispatch(e: IKeyboardEvent, target: IContextKeyServiceTarget): boolean {
    return this._doDispatch(this.resolveKeyboardEvent(e), target);
  }

  private _doDispatch(keybinding: ResolvedKeybinding, target: IContextKeyServiceTarget): boolean {
    let shouldPreventDefault = false;

    const [firstPart,] = keybinding.getDispatchParts();
    if (firstPart === null) {
      // this._log(`\\ Keyboard event cannot be dispatched.`);
      // cannot be dispatched, probably only modifier keys
      return shouldPreventDefault;
    }

    const contextValue = this._contextKeyService.getContext(target);
    const keypressLabel = keybinding.getLabel();
    const resolveResult = this._getResolver().resolve(contextValue, firstPart);

    // this._logService.trace('KeybindingService#dispatch', keypressLabel, resolveResult?.commandId);

    if (resolveResult && resolveResult.commandId) {
      if (!resolveResult.bubble) {
        shouldPreventDefault = true;
      }
      if (typeof resolveResult.commandArgs === 'undefined') {
        this._commandService.executeCommand(resolveResult.commandId).then(undefined, err => console.warn(err));
      } else {
        this._commandService.executeCommand(resolveResult.commandId, resolveResult.commandArgs).then(undefined, err => console.warn(err));
      }
    }

    return shouldPreventDefault;
  }
}
