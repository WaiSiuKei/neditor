import { Disposable, IDisposable } from '@neditor/core/base/common/lifecycle';
import {
  ConfigurationTarget,
  IConfigurationChangeEvent,
  IConfigurationService,
  IConfigurationValue
} from './configuration';
import { Configuration, DefaultConfigurationModel } from './configurationModels';
import { equals } from '@neditor/core/base/common/objects';
import { Optional } from "@neditor/core/base/common/typescript";
import { Emitter, Event } from "@neditor/core/base/common/event";

export class ConfigurationService extends Disposable implements IConfigurationService, IDisposable {
  declare readonly _serviceBrand: undefined;

  private readonly _onDidChangeConfiguration: Emitter<IConfigurationChangeEvent> = this._register(new Emitter<IConfigurationChangeEvent>());
  readonly onDidChangeConfiguration: Event<IConfigurationChangeEvent> = this._onDidChangeConfiguration.event;

  private configuration: Configuration;
  constructor() {
    super();
    this.configuration = new Configuration(new DefaultConfigurationModel());
  }

  getValue<T>(): T;
  getValue<T>(section: string): T;
  getValue(arg1?: any): any {
    const section = typeof arg1 === 'string' ? arg1 : undefined;
    return this.configuration.getValue(section);
  }

  updateValue(key: string, value: any): Promise<void>;
  async updateValue(key: string, value: any): Promise<void> {
    const target = this.deriveConfigurationTarget(key, value);
    return target ? this.writeConfigurationValue(key, value, target) : Promise.resolve();
  }

  inspect<T>(key: string): IConfigurationValue<T> {
    return this.configuration.inspect<T>(key);
  }

  private deriveConfigurationTarget(key: string, value: any): Optional<ConfigurationTarget> {
    if (value === void 0) {
      // Ignore. But expected is to remove the value from all targets
      return void 0;
    }

    const inspect = this.inspect(key);
    if (equals(value, inspect.value)) {
      // No change. So ignore.
      return void 0;
    }

    // if (inspect.workspace !== void 0) {
    //   return ConfigurationTarget.WORKSPACE;
    // }

    return ConfigurationTarget.USER;
  }

  private writeConfigurationValue(
    key: string,
    value: any,
    target: ConfigurationTarget,
  ): Promise<void> {
    if (target === ConfigurationTarget.DEFAULT) {
      return Promise.reject(new Error('Invalid configuration target'));
    }

    if (target === ConfigurationTarget.MEMORY) {
      this.configuration.updateValue(key, value);
      return Promise.resolve();
    } else {
      throw new Error('500');
    }
  }
}
