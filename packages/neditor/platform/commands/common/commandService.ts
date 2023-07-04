import { Disposable } from "../../../base/common/lifecycle";
import { CommandsRegistry, ICommandEvent, ICommandService } from "./commands";
import { Emitter, Event } from "../../../base/common/event";
import { IInstantiationService } from "../../instantiation/common/instantiation";
import { ILogService } from "../../log/common/log";
import { registerSingleton } from "../../instantiation/common/extensions";

export class CommandService extends Disposable implements ICommandService {

  declare readonly _serviceBrand: undefined;

  private readonly _onWillExecuteCommand: Emitter<ICommandEvent> = this._register(new Emitter<ICommandEvent>());
  public readonly onWillExecuteCommand: Event<ICommandEvent> = this._onWillExecuteCommand.event;

  private readonly _onDidExecuteCommand: Emitter<ICommandEvent> = new Emitter<ICommandEvent>();
  public readonly onDidExecuteCommand: Event<ICommandEvent> = this._onDidExecuteCommand.event;

  constructor(
    @IInstantiationService private readonly _instantiationService: IInstantiationService,
    @ILogService private readonly _logService: ILogService
  ) {
    super();
  }

  executeCommand<T>(id: string, ...args: any[]): Promise<T> {
    this._logService.trace('CommandService#executeCommand', id);

    // we always send an activation event, but
    // we don't wait for it when the extension
    // host didn't yet start and the command is already registered

    return this._tryExecuteCommand(id, args);
  }

  private _tryExecuteCommand(id: string, args: any[]): Promise<any> {
    const command = CommandsRegistry.getCommand(id);
    if (!command) {
      return Promise.reject(new Error(`command '${id}' not found`));
    }
    try {
      this._onWillExecuteCommand.fire({ commandId: id, args });
      const result = this._instantiationService.invokeFunction(command.handler, ...args);
      this._onDidExecuteCommand.fire({ commandId: id, args });
      return Promise.resolve(result);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

registerSingleton(ICommandService, CommandService, true);
