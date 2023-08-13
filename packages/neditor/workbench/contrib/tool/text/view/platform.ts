import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { OS } from '../../../../../base/browser/platform';
import { Keybinding, ResolvedKeybinding, SimpleKeybinding } from '../../../../../base/common/keyCodes';
import { Optional } from '../../../../../base/common/typescript';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { ICanvasService } from '../../../../../platform/canvas/common/canvas';
import { CommandRegistryImpl, ICommandService } from '../../../../../platform/commands/common/commands';
import { ContextKeyExpr, ContextKeyExpression, IContextKeyService } from '../../../../../platform/contextkey/common/contextkey';
import { createDecorator, ServicesAccessor } from '../../../../../platform/instantiation/common/instantiation';
import { AbstractKeybindingService } from '../../../../../platform/keybinding/common/abstractKeybindingService';
import { KeybindingResolver } from '../../../../../platform/keybinding/common/keybindingResolver';
import { IKeybindingItem, IKeybindings, KeybindingsRegistry, KeybindingsRegistryImpl } from '../../../../../platform/keybinding/common/keybindingsRegistry';
import { ResolvedKeybindingItem } from '../../../../../platform/keybinding/common/resolvedKeybindingItem';
import { USLayoutResolvedKeybinding } from '../../../../../platform/keybinding/common/usLayoutResolvedKeybinding';
import { Editor } from '../editor';

const TextEditorKeybindingsRegistry = new KeybindingsRegistryImpl();
const TextEditorCommandRegistry = new CommandRegistryImpl();

export const ITextEditorService = createDecorator<ITextEditorService>('textEditorService');

export interface ITextEditorService {
  _serviceBrand: undefined;
  getCurrentEditor(): Optional<Editor>;
  addEditor(editor: Editor): void;
  removeEditor(editor: Editor): void;
}

export class TextEditorKeybindingService extends AbstractKeybindingService {
  private _cachedResolver: KeybindingResolver | null;

  constructor(
    @IContextKeyService contextKeyService: IContextKeyService,
    @ICommandService commandService: ICommandService,
  ) {
    super(contextKeyService, commandService);

    this._cachedResolver = null;
  }

  protected _getResolver(): KeybindingResolver {
    if (!this._cachedResolver) {
      const defaults = this._toNormalizedKeybindingItems(
        TextEditorKeybindingsRegistry.getDefaultKeybindings(),
        true,
      );
      this._cachedResolver = new KeybindingResolver(defaults, []);
    }
    return this._cachedResolver;
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

export class TextEditorService implements ITextEditorService {
  _serviceBrand: undefined;
  private _editors: Editor[] = [];
  getCurrentEditor(): Optional<Editor> {
    if (!this._editors.length) return undefined;
    return this._editors[0];
  }

  addEditor(editor: Editor) {
    this._editors.push(editor);
  }
  removeEditor(editor: Editor) {
    const idx = this._editors.indexOf(editor);
    if (idx > -1) {
      this._editors.splice(idx, 1);
    }
  }
}

export interface ICommandKeybindingsOptions extends IKeybindings {
  kbExpr?: ContextKeyExpression | null;
  /**
   * the default keybinding arguments
   */
  args?: any;
}

export interface ICommandOptions {
  id: string;
  precondition?: ContextKeyExpression | undefined;
  kbOpts?: ICommandKeybindingsOptions;
}

export abstract class TextEditorCommand {
  public readonly id: string;
  public readonly precondition: ContextKeyExpression | undefined;
  private readonly _kbOpts: ICommandKeybindingsOptions | undefined;

  constructor(opts: ICommandOptions) {
    this.id = opts.id;
    this.precondition = opts.precondition;
    this._kbOpts = opts.kbOpts;
  }

  public register(): void {
    if (this._kbOpts) {
      let kbWhen = this._kbOpts.kbExpr;
      if (this.precondition) {
        if (kbWhen) {
          kbWhen = ContextKeyExpr.and(kbWhen, this.precondition);
        } else {
          kbWhen = this.precondition;
        }
      }

      TextEditorKeybindingsRegistry.registerCommandAndKeybindingRule({
        id: this.id,
        handler: (accessor, args) => this.runCommand(accessor, args),
        weight: 1,
        args: this._kbOpts.args,
        when: kbWhen,
        primary: this._kbOpts.primary,
        secondary: this._kbOpts.secondary,
        win: this._kbOpts.win,
        linux: this._kbOpts.linux,
        mac: this._kbOpts.mac,
      });

    } else {
      TextEditorCommandRegistry.registerCommand({
        id: this.id,
        handler: (accessor, args) => this.runCommand(accessor, args),
      });
    }
  }

  public runCommand(accessor: ServicesAccessor, args: any): void | Promise<void> {
    const textEditorService = accessor.get(ITextEditorService);
    const canvasService = accessor.get(ICanvasService);

    const editor = textEditorService.getCurrentEditor();
    if (!editor) {
      return;
    }

    const canvas = canvasService.getFocusedCanvas() || canvasService.getActiveCanvas();
    if (!canvas) {
      // well, at least we tried...
      return;
    }

    return this.runTextEditorCommand(editor, canvas, args);

    // return editor.invokeWithinContext((accessor) => {
    //   const kbService = accessor.get(IContextKeyService);
    //   if (!kbService.contextMatchesRules(withNullAsUndefined(this.precondition))) {
    //     // precondition does not hold
    //     return;
    //   }
    //
    // });
  }

  public abstract runTextEditorCommand(editor: Editor, canvas: ICanvas, args: any): void | Promise<void>;
}

export function registerTextEditorCommand<T extends TextEditorCommand>(canvasCommand: T): T {
  canvasCommand.register();
  return canvasCommand;
}
