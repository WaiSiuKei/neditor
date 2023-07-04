import { Keybinding, KeyCode, KeyCodeUtils, SimpleKeybinding } from '@neditor/core/base/common/keyCodes';
import { OperatingSystem } from '@neditor/core/base/browser/platform';
import { BaseResolvedKeybinding } from './baseResolvedKeybinding';

/**
 * Do not instantiate. Use KeybindingService to get a ResolvedKeybinding seeded with information about the current kb layout.
 */
export class USLayoutResolvedKeybinding extends BaseResolvedKeybinding<SimpleKeybinding> {
  constructor(actual: Keybinding, os: OperatingSystem) {
    super(os, [actual]);
  }

  private _keyCodeToUILabel(keyCode: KeyCode): string {
    if (this._os === OperatingSystem.Macintosh) {
      switch (keyCode) {
        case KeyCode.LeftArrow:
          return '←';
        case KeyCode.UpArrow:
          return '↑';
        case KeyCode.RightArrow:
          return '→';
        case KeyCode.DownArrow:
          return '↓';
      }
    }
    return KeyCodeUtils.toString(keyCode);
  }

  protected _getLabel(keybinding: SimpleKeybinding): string | null {
    if (keybinding.isDuplicateModifierCase()) {
      return '';
    }
    return this._keyCodeToUILabel(keybinding.keyCode);
  }

  protected _getDispatchPart(keybinding: SimpleKeybinding): string | null {
    return USLayoutResolvedKeybinding.getDispatchStr(keybinding);
  }

  public static getDispatchStr(keybinding: SimpleKeybinding): string | null {
    if (keybinding.isModifierKey()) {
      return null;
    }
    let result = '';

    if (keybinding.ctrlKey) {
      result += 'ctrl+';
    }
    if (keybinding.shiftKey) {
      result += 'shift+';
    }
    if (keybinding.altKey) {
      result += 'alt+';
    }
    if (keybinding.metaKey) {
      result += 'meta+';
    }
    result += KeyCodeUtils.toString(keybinding.keyCode);

    return result;
  }

  protected _getSingleModifierDispatchPart(keybinding: SimpleKeybinding): string | null {
    if (
      keybinding.keyCode === KeyCode.Ctrl &&
      !keybinding.shiftKey &&
      !keybinding.altKey &&
      !keybinding.metaKey
    ) {
      return 'ctrl';
    }
    if (
      keybinding.keyCode === KeyCode.Shift &&
      !keybinding.ctrlKey &&
      !keybinding.altKey &&
      !keybinding.metaKey
    ) {
      return 'shift';
    }
    if (
      keybinding.keyCode === KeyCode.Alt &&
      !keybinding.ctrlKey &&
      !keybinding.shiftKey &&
      !keybinding.metaKey
    ) {
      return 'alt';
    }
    if (
      keybinding.keyCode === KeyCode.Meta &&
      !keybinding.ctrlKey &&
      !keybinding.shiftKey &&
      !keybinding.altKey
    ) {
      return 'meta';
    }
    return null;
  }
}
