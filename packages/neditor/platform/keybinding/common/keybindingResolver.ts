import { ResolvedKeybindingItem } from './resolvedKeybindingItem';
import {
  ContextKeyExpression,
  ContextKeyExprType,
  IContext,
} from '../../contextkey/common/contextkey';

export interface IResolveResult {
  /** Whether the resolved keybinding is leaving (and executing) a chord */
  leaveChord: boolean;
  commandId: string | null;
  commandArgs: any;
  bubble: boolean;
}

export class KeybindingResolver {
  private readonly _defaultKeybindings: ResolvedKeybindingItem[];
  private readonly _keybindings: ResolvedKeybindingItem[];
  private readonly _defaultBoundCommands: Map<string, boolean>;
  private readonly _map: Map<string, ResolvedKeybindingItem[]>;
  private readonly _lookupMap: Map<string, ResolvedKeybindingItem[]>;

  constructor(defaultKeybindings: ResolvedKeybindingItem[], overrides: ResolvedKeybindingItem[]) {
    this._defaultKeybindings = defaultKeybindings;

    this._defaultBoundCommands = new Map<string, boolean>();
    for (let i = 0, len = defaultKeybindings.length; i < len; i++) {
      const command = defaultKeybindings[i].command;
      if (command) {
        this._defaultBoundCommands.set(command, true);
      }
    }

    this._map = new Map<string, ResolvedKeybindingItem[]>();
    this._lookupMap = new Map<string, ResolvedKeybindingItem[]>();

    this._keybindings = KeybindingResolver.combine(defaultKeybindings, overrides);
    for (let i = 0, len = this._keybindings.length; i < len; i++) {
      const k = this._keybindings[i];
      if (k.keypressParts.length === 0) {
        // unbound
        continue;
      }

      if (k.when && k.when.type === ContextKeyExprType.False) {
        // when condition is false
        continue;
      }

      // TODO@chords
      this._addKeyPress(k.keypressParts[0], k);
    }
  }

  private static _isTargetedForRemoval(
    defaultKb: ResolvedKeybindingItem,
    keypressFirstPart: string | null,
    keypressChordPart: string | null,
    command: string,
    when: ContextKeyExpression | undefined,
  ): boolean {
    if (defaultKb.command !== command) {
      return false;
    }
    // TODO@chords
    if (keypressFirstPart && defaultKb.keypressParts[0] !== keypressFirstPart) {
      return false;
    }
    // TODO@chords
    if (keypressChordPart && defaultKb.keypressParts[1] !== keypressChordPart) {
      return false;
    }
    if (when) {
      if (!defaultKb.when) {
        return false;
      }
      if (!when.equals(defaultKb.when)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Looks for rules containing -command in `overrides` and removes them directly from `defaults`.
   */
  public static combine(
    defaults: ResolvedKeybindingItem[],
    rawOverrides: ResolvedKeybindingItem[],
  ): ResolvedKeybindingItem[] {
    defaults = defaults.slice(0);
    const overrides: ResolvedKeybindingItem[] = [];
    for (const override of rawOverrides) {
      if (
        !override.command ||
        override.command.length === 0 ||
        override.command.charAt(0) !== '-'
      ) {
        overrides.push(override);
        continue;
      }

      const command = override.command.substr(1);
      // TODO@chords
      const keypressFirstPart = override.keypressParts[0];
      const keypressChordPart = override.keypressParts[1];
      const when = override.when;
      for (let j = defaults.length - 1; j >= 0; j--) {
        if (
          this._isTargetedForRemoval(
            defaults[j],
            keypressFirstPart,
            keypressChordPart,
            command,
            when,
          )
        ) {
          defaults.splice(j, 1);
        }
      }
    }
    return defaults.concat(overrides);
  }

  private _addKeyPress(keypress: string, item: ResolvedKeybindingItem): void {
    const conflicts = this._map.get(keypress);

    if (typeof conflicts === 'undefined') {
      // There is no conflict so far
      this._map.set(keypress, [item]);
      this._addToLookupMap(item);
      return;
    }

    for (let i = conflicts.length - 1; i >= 0; i--) {
      const conflict = conflicts[i];

      if (conflict.command === item.command) {
        continue;
      }

      const conflictIsChord = conflict.keypressParts.length > 1;
      const itemIsChord = item.keypressParts.length > 1;

      // TODO@chords
      if (conflictIsChord && itemIsChord && conflict.keypressParts[1] !== item.keypressParts[1]) {
        // The conflict only shares the chord start with this command
        continue;
      }

      if (KeybindingResolver.whenIsEntirelyIncluded(conflict.when, item.when)) {
        // `item` completely overwrites `conflict`
        // Remove conflict from the lookupMap
        this._removeFromLookupMap(conflict);
      }
    }

    conflicts.push(item);
    this._addToLookupMap(item);
  }

  private _addToLookupMap(item: ResolvedKeybindingItem): void {
    if (!item.command) {
      return;
    }

    let arr = this._lookupMap.get(item.command);
    if (typeof arr === 'undefined') {
      arr = [item];
      this._lookupMap.set(item.command, arr);
    } else {
      arr.push(item);
    }
  }

  private _removeFromLookupMap(item: ResolvedKeybindingItem): void {
    if (!item.command) {
      return;
    }
    const arr = this._lookupMap.get(item.command);
    if (typeof arr === 'undefined') {
      return;
    }
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i] === item) {
        arr.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Returns true if it is provable `a` implies `b`.
   */
  public static whenIsEntirelyIncluded(
    a: ContextKeyExpression | null | undefined,
    b: ContextKeyExpression | null | undefined,
  ): boolean {
    if (!b) {
      return true;
    }
    if (!a) {
      return false;
    }

    return this._implies(a, b);
  }

  /**
   * Returns true if it is provable `p` implies `q`.
   */
  private static _implies(p: ContextKeyExpression, q: ContextKeyExpression): boolean {
    const notP = p.negate();

    const terminals = (node: ContextKeyExpression) => {
      if (node.type === ContextKeyExprType.Or) {
        return node.expr;
      }
      return [node];
    };

    const expr = terminals(notP).concat(terminals(q));
    for (let i = 0; i < expr.length; i++) {
      const a = expr[i];
      const notA = a.negate();
      for (let j = i + 1; j < expr.length; j++) {
        const b = expr[j];
        if (notA.equals(b)) {
          return true;
        }
      }
    }

    return false;
  }

  public getDefaultBoundCommands(): Map<string, boolean> {
    return this._defaultBoundCommands;
  }

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._defaultKeybindings;
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._keybindings;
  }

  public lookupKeybindings(commandId: string): ResolvedKeybindingItem[] {
    const items = this._lookupMap.get(commandId);
    if (typeof items === 'undefined' || items.length === 0) {
      return [];
    }

    // Reverse to get the most specific item first
    const result: ResolvedKeybindingItem[] = [];
    let resultLen = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      result[resultLen++] = items[i];
    }
    return result;
  }

  public lookupPrimaryKeybinding(commandId: string): ResolvedKeybindingItem | null {
    const items = this._lookupMap.get(commandId);
    if (typeof items === 'undefined' || items.length === 0) {
      return null;
    }

    return items[items.length - 1];
  }

  public resolve(context: IContext, keypress: string): IResolveResult | null {
    this._log(`| Resolving ${keypress}`);
    let lookupMap: ResolvedKeybindingItem[] | null = null;

    const candidates = this._map.get(keypress);
    if (typeof candidates === 'undefined') {
      // No bindings with `keypress`
      this._log(`\\ No keybinding entries.`);
      return null;
    }

    lookupMap = candidates;

    const result = this._findCommand(context, lookupMap);
    if (!result) {
      this._log(
        `\\ From ${lookupMap.length} keybinding entries, no when clauses matched the context.`,
      );
      return null;
    }

    this._log(
      `\\ From ${lookupMap.length} keybinding entries, matched ${
        result.command
      }, when: ${printWhenExplanation(result.when)}, source: ${printSourceExplanation(result)}.`,
    );
    return {
      leaveChord: result.keypressParts.length > 1,
      commandId: result.command,
      commandArgs: result.commandArgs,
      bubble: result.bubble,
    };
  }

  private _findCommand(
    context: IContext,
    matches: ResolvedKeybindingItem[],
  ): ResolvedKeybindingItem | null {
    for (let i = matches.length - 1; i >= 0; i--) {
      const k = matches[i];

      if (!KeybindingResolver.contextMatchesRules(context, k.when)) {
        continue;
      }

      return k;
    }

    return null;
  }

  public static contextMatchesRules(
    context: IContext,
    rules: ContextKeyExpression | null | undefined,
  ): boolean {
    if (!rules) {
      return true;
    }
    return rules.evaluate(context);
  }

  _log(...args: any[]) {
    // console.log(...args)
  }
}

function printWhenExplanation(when: ContextKeyExpression | undefined): string {
  if (!when) {
    return `no when condition`;
  }
  return `${when.serialize()}`;
}

function printSourceExplanation(kb: ResolvedKeybindingItem): string {
  return kb.extensionId
    ? kb.isBuiltinExtension
      ? `built-in extension ${kb.extensionId}`
      : `user extension ${kb.extensionId}`
    : kb.isDefault
    ? `built-in`
    : `user`;
}
