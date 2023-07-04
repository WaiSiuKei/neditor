import { createDecorator } from '@neditor/core/platform/instantiation/common/instantiation';
import { Keybinding, ResolvedKeybinding } from '@neditor/core/base/common/keyCodes';
import { IKeyboardEvent } from '@neditor/core/base/browser/keyboardEvent';
import { IContextKeyServiceTarget } from '../../contextkey/common/contextkey';

export const IKeybindingService = createDecorator<IKeybindingService>('keybindingService');

export interface IKeybindingService {
  readonly _serviceBrand: undefined;

  // onDidUpdateKeybindings: Event<IKeybindingEvent>;

  /**
   * Returns none, one or many (depending on keyboard layout)!
   */
  resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[];

  resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding;

  // resolveUserBinding(userBinding: string): ResolvedKeybinding[];

  /**
   * Resolve and dispatch `keyboardEvent` and invoke the command.
   */
  dispatchEvent(e: IKeyboardEvent, target: IContextKeyServiceTarget): boolean;

  /**
   * Resolve and dispatch `keyboardEvent`, but do not invoke the command or change inner state.
   */
  // softDispatch(keyboardEvent: IKeyboardEvent, target: IContextKeyServiceTarget): IResolveResult | null;

  // dispatchByUserSettingsLabel(userSettingsLabel: string, target: IContextKeyServiceTarget): void;

  /**
   * Look up keybindings for a command.
   * Use `lookupKeybinding` if you are interested in the preferred keybinding.
   */
  lookupKeybindings(commandId: string): ResolvedKeybinding[];

  /**
   * Look up the preferred (last defined) keybinding for a command.
   * @returns The preferred keybinding or null if the command is not bound.
   */
  lookupKeybinding(commandId: string): ResolvedKeybinding | undefined;
}
