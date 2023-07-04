/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Emitter, Event } from '@neditor/core/base/common/event';
import { Iterable } from '@neditor/core/base/common/iterator';
import { IDisposable, toDisposable } from '@neditor/core/base/common/lifecycle';
import { LinkedList } from '@neditor/core/base/common/linkedList';
import {
  createDecorator,
  ServicesAccessor,
} from '@neditor/core/platform/instantiation/common/instantiation';

export const ICommandService = createDecorator<ICommandService>('commandService');

export interface ICommandEvent {
  commandId: string;
  args: any[];
}

export interface ICommandService {
  readonly _serviceBrand: undefined;
  onWillExecuteCommand: Event<ICommandEvent>;
  onDidExecuteCommand: Event<ICommandEvent>;
  executeCommand<T = any>(commandId: string, ...args: any[]): Promise<T | undefined>;
}

export type ICommandsMap = Map<string, ICommand>;

export interface ICommandHandler {
  (accessor: ServicesAccessor, ...args: any[]): void;
}

export interface ICommand {
  id: string;
  handler: ICommandHandler;
}

export interface ICommandRegistry {
  onDidRegisterCommand: Event<string>;
  registerCommand(id: string, command: ICommandHandler): IDisposable;
  registerCommand(command: ICommand): IDisposable;
  getCommand(id: string): ICommand | undefined;
  getCommands(): ICommandsMap;
}

export const CommandsRegistry: ICommandRegistry = new class implements ICommandRegistry {

  private readonly _commands = new Map<string, LinkedList<ICommand>>();

  private readonly _onDidRegisterCommand = new Emitter<string>();
  readonly onDidRegisterCommand: Event<string> = this._onDidRegisterCommand.event;

  registerCommand(idOrCommand: string | ICommand, handler?: ICommandHandler): IDisposable {

    if (!idOrCommand) {
      throw new Error(`invalid command`);
    }

    if (typeof idOrCommand === 'string') {
      if (!handler) {
        throw new Error(`invalid command`);
      }
      return this.registerCommand({ id: idOrCommand, handler });
    }

    // find a place to store the command
    const { id } = idOrCommand;

    let commands = this._commands.get(id);
    if (!commands) {
      commands = new LinkedList<ICommand>();
      this._commands.set(id, commands);
    }

    let removeFn = commands.unshift(idOrCommand);

    let ret = toDisposable(() => {
      removeFn();
      const command = this._commands.get(id);
      if (command?.isEmpty()) {
        this._commands.delete(id);
      }
    });

    // tell the world about this command
    this._onDidRegisterCommand.fire(id);

    return ret;
  }

  getCommand(id: string): ICommand | undefined {
    const list = this._commands.get(id);
    if (!list || list.isEmpty()) {
      return undefined;
    }
    return Iterable.first(list);
  }

  getCommands(): ICommandsMap {
    const result = new Map<string, ICommand>();
    for (const key of this._commands.keys()) {
      const command = this.getCommand(key);
      if (command) {
        result.set(key, command);
      }
    }
    return result;
  }
};
