import { IKeybindings, KeybindingsRegistry } from "../platform/keybinding/common/keybindingsRegistry";
import { ContextKeyExpr, ContextKeyExpression, IContextKeyService } from "../platform/contextkey/common/contextkey";
import { ServicesAccessor } from "../platform/instantiation/common/instantiation";
import { CommandsRegistry } from "../platform/commands/common/commands";
import { ICanvasService } from "../platform/canvas/common/canvas";
import { withNullAsUndefined } from "../base/common/type";
import { ICanvas } from "./canvas/canvas";

export interface ICommandKeybindingsOptions extends IKeybindings {
  kbExpr?: ContextKeyExpression | null;
  weight: number;
  /**
   * the default keybinding arguments
   */
  args?: any;
}

export interface ICommandOptions {
  id: string;
  precondition: ContextKeyExpression | undefined;
  kbOpts?: ICommandKeybindingsOptions;
}

export abstract class Command {
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

      KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: this.id,
        handler: (accessor, args) => this.runCommand(accessor, args),
        weight: this._kbOpts.weight,
        args: this._kbOpts.args,
        when: kbWhen,
        primary: this._kbOpts.primary,
        secondary: this._kbOpts.secondary,
        win: this._kbOpts.win,
        linux: this._kbOpts.linux,
        mac: this._kbOpts.mac,
      });

    } else {
      CommandsRegistry.registerCommand({
        id: this.id,
        handler: (accessor, args) => this.runCommand(accessor, args),
      });
    }
  }

  public abstract runCommand(accessor: ServicesAccessor, args: any): void | Promise<void>;
}

export abstract class CanvasCommand extends Command {

  public runCommand(accessor: ServicesAccessor, args: any): void | Promise<void> {
    const canvasService = accessor.get(ICanvasService);

    const canvas = canvasService.getFocusedCanvas() || canvasService.getActiveCanvas()
    if (!canvas) {
      // well, at least we tried...
      return;
    }

    return canvas.invokeWithinContext((accessor) => {
      const kbService = accessor.get(IContextKeyService);
      if (!kbService.contextMatchesRules(withNullAsUndefined(this.precondition))) {
        // precondition does not hold
        return;
      }

      return this.runCanvasCommand(accessor, canvas, args);
    });
  }

  public abstract runCanvasCommand(accessor: ServicesAccessor | null, editor: ICanvas, args: any): void | Promise<void>;
}

export function registerCanvasCommand<T extends CanvasCommand>(canvasCommand: T): T {
  canvasCommand.register()
  return canvasCommand;
}
