import { ResolvedKeybinding, ResolvedKeybindingPart } from '@neditor/core/base/common/keyCodes';
import { OperatingSystem } from '@neditor/core/base/browser/platform';
import { Modifiers, UILabelProvider } from '@neditor/core/base/common/keybindingLabels';

export abstract class BaseResolvedKeybinding<T extends Modifiers> extends ResolvedKeybinding {
  protected readonly _os: OperatingSystem;
  protected readonly _parts: T[];

  constructor(os: OperatingSystem, parts: T[]) {
    super();
    if (parts.length === 0) {
      throw new Error('400');
    }
    this._os = os;
    this._parts = parts;
  }

  public getLabel(): string | null {
    return UILabelProvider.toLabel(this._os, this._parts, (keybinding) =>
      this._getLabel(keybinding),
    );
  }

  public getParts(): ResolvedKeybindingPart[] {
    return this._parts.map((keybinding) => this._getPart(keybinding));
  }

  private _getPart(keybinding: T): ResolvedKeybindingPart {
    return new ResolvedKeybindingPart(
      keybinding.ctrlKey,
      keybinding.shiftKey,
      keybinding.altKey,
      keybinding.metaKey,
      this._getLabel(keybinding),
    );
  }

  public getDispatchParts(): (string | null)[] {
    return this._parts.map((keybinding) => this._getDispatchPart(keybinding));
  }

  public getSingleModifierDispatchParts(): (string | null)[] {
    return this._parts.map((keybinding) => this._getSingleModifierDispatchPart(keybinding));
  }

  protected abstract _getLabel(keybinding: T): string | null;
  protected abstract _getDispatchPart(keybinding: T): string | null;
  protected abstract _getSingleModifierDispatchPart(keybinding: T): string | null;
}
