import { OperatingSystem } from '../browser/platform';

export interface ModifierLabels {
  readonly ctrlKey: string;
  readonly shiftKey: string;
  readonly altKey: string;
  readonly metaKey: string;
  readonly separator: string;
}

export interface Modifiers {
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export interface KeyLabelProvider<T extends Modifiers> {
  (keybinding: T): string | null;
}

export class ModifierLabelProvider {

  public readonly modifierLabels: ModifierLabels[];

  constructor(mac: ModifierLabels, windows: ModifierLabels, linux: ModifierLabels = windows) {
    this.modifierLabels = [null!]; // index 0 will never me accessed.
    this.modifierLabels[OperatingSystem.Macintosh] = mac;
    this.modifierLabels[OperatingSystem.Windows] = windows;
    this.modifierLabels[OperatingSystem.Linux] = linux;
  }

  public toLabel<T extends Modifiers>(OS: OperatingSystem, parts: T[], keyLabelProvider: KeyLabelProvider<T>): string | null {
    if (parts.length === 0) {
      return null;
    }

    const result: string[] = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const keyLabel = keyLabelProvider(part);
      if (keyLabel === null) {
        // this keybinding cannot be expressed...
        return null;
      }
      result[i] = _simpleAsString(part, keyLabel, this.modifierLabels[OS]);
    }
    return result.join(' ');
  }
}

/**
 * A label provider that prints modifiers in a suitable format for displaying in the UI.
 */
export const UILabelProvider = new ModifierLabelProvider(
  {
    ctrlKey: '⌃',
    shiftKey: '⇧',
    altKey: '⌥',
    metaKey: '⌘',
    separator: '',
  },

  {
    ctrlKey: 'Ctrl',
    shiftKey: 'Shift',
    altKey: 'Alt',
    metaKey: 'Windows',
    separator: '+',
  },
  {
    ctrlKey: 'Ctrl',
    shiftKey: 'Shift',
    altKey: 'Alt',
    metaKey: 'Super',
    separator: '+',
  }
);


function _simpleAsString(modifiers: Modifiers, key: string, labels: ModifierLabels): string {
  if (key === null) {
    return '';
  }

  const result: string[] = [];

  // translate modifier keys: Ctrl-Shift-Alt-Meta
  if (modifiers.ctrlKey) {
    result.push(labels.ctrlKey);
  }

  if (modifiers.shiftKey) {
    result.push(labels.shiftKey);
  }

  if (modifiers.altKey) {
    result.push(labels.altKey);
  }

  if (modifiers.metaKey) {
    result.push(labels.metaKey);
  }

  // the actual key
  if (key !== '') {
    result.push(key);
  }

  return result.join(labels.separator);
}
