import { AbstractKeybindingService } from '../common/abstractKeybindingService';
import { KeybindingResolver } from '../common/keybindingResolver';
import { IKeybindingItem, KeybindingsRegistry } from '../common/keybindingsRegistry';
import { IContextKeyService } from '../../contextkey/common/contextkey';
import { ICommandService } from '@neditor/core/platform/commands/common/commands';
import { IKeyboardEvent } from '@neditor/core/base/browser/keyboardEvent';
import { Keybinding, ResolvedKeybinding, SimpleKeybinding } from '@neditor/core/base/common/keyCodes';
import { OS } from '@neditor/core/base/browser/platform';
import { ResolvedKeybindingItem } from '../common/resolvedKeybindingItem';
import { USLayoutResolvedKeybinding } from '../common/usLayoutResolvedKeybinding';
import { registerSingleton } from '../../instantiation/common/extensions';
import { IKeybindingService } from '../common/keybinding';

export class KeybindingService extends AbstractKeybindingService {
  private _cachedResolver: KeybindingResolver | null;
  private readonly _dynamicKeybindings: IKeybindingItem[];

  constructor(
    @IContextKeyService contextKeyService: IContextKeyService,
    @ICommandService commandService: ICommandService,
  ) {
    super(contextKeyService, commandService);

    this._cachedResolver = null;
    this._dynamicKeybindings = [];
  }

  protected _getResolver(): KeybindingResolver {
    if (!this._cachedResolver) {
      const defaults = this._toNormalizedKeybindingItems(
        KeybindingsRegistry.getDefaultKeybindings(),
        true,
      );
      const overrides = this._toNormalizedKeybindingItems(this._dynamicKeybindings, false);
      this._cachedResolver = new KeybindingResolver(defaults, overrides);
    }
    return this._cachedResolver;
  }

  protected _documentHasFocus(): boolean {
    return document.hasFocus();
  }

  private _toNormalizedKeybindingItems(
    items: IKeybindingItem[],
    isDefault: boolean,
  ): ResolvedKeybindingItem[] {
    const result: ResolvedKeybindingItem[] = [];
    let resultLen = 0;
    for (const item of items) {
      const when = item.when || undefined;
      const keybinding = item.keybinding;

      if (!keybinding) {
        // This might be a removal keybinding item in user settings => accept it
        result[resultLen++] = new ResolvedKeybindingItem(
          undefined,
          item.command,
          item.commandArgs,
          when,
          isDefault,
          null,
          false,
        );
      } else {
        const resolvedKeybindings = this.resolveKeybinding(keybinding);
        for (const resolvedKeybinding of resolvedKeybindings) {
          result[resultLen++] = new ResolvedKeybindingItem(
            resolvedKeybinding,
            item.command,
            item.commandArgs,
            when,
            isDefault,
            null,
            false,
          );
        }
      }
    }

    return result;
  }

  public resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[] {
    return [new USLayoutResolvedKeybinding(keybinding, OS)];
  }

  public resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding {
    const keybinding = new SimpleKeybinding(
      keyboardEvent.ctrlKey,
      keyboardEvent.shiftKey,
      keyboardEvent.altKey,
      keyboardEvent.metaKey,
      keyboardEvent.keyCode,
    );
    return new USLayoutResolvedKeybinding(keybinding, OS);
  }
}

registerSingleton(IKeybindingService, KeybindingService)
