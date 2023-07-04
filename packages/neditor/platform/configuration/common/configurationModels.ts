import {
  addToValueTree,
  getConfigurationKeys,
  getConfigurationValue,
  getDefaultValues,
  IConfigurationData,
  IConfigurationModel,
  IConfigurationValue,
  IOverrides,
  OVERRIDE_PROPERTY_PATTERN,
  overrideIdentifierFromKey,
  removeFromValueTree,
  toValuesTree,
} from './configuration';
import * as objects from '@neditor/core/base/common/objects';
import { isObject } from '@neditor/core/base/common/type';
import * as arrays from '@neditor/core/base/common/array';

export class ConfigurationModel implements IConfigurationModel {
  private isFrozen = false;

  constructor(
    private _contents: any = {},
    private _keys: string[] = [],
    private _overrides: IOverrides[] = [],
  ) {}

  get contents(): any {
    return this.checkAndFreeze(this._contents);
  }

  get overrides(): IOverrides[] {
    return this.checkAndFreeze(this._overrides);
  }

  get keys(): string[] {
    return this.checkAndFreeze(this._keys);
  }

  isEmpty(): boolean {
    return (
      this._keys.length === 0 &&
      Object.keys(this._contents).length === 0 &&
      this._overrides.length === 0
    );
  }

  getValue<V>(section: string | undefined): V {
    return section ? getConfigurationValue<any>(this.contents, section) : this.contents;
  }

  getOverrideValue<V>(section: string | undefined, overrideIdentifier: string): V | undefined {
    const overrideContents = this.getContentsForOverrideIdentifer(overrideIdentifier);
    return overrideContents
      ? section
        ? getConfigurationValue<any>(overrideContents, section)
        : overrideContents
      : undefined;
  }

  getKeysForOverrideIdentifier(identifier: string): string[] {
    for (const override of this.overrides) {
      if (override.identifiers.indexOf(identifier) !== -1) {
        return override.keys;
      }
    }
    return [];
  }

  override(identifier: string): ConfigurationModel {
    const overrideContents = this.getContentsForOverrideIdentifer(identifier);

    if (
      !overrideContents ||
      typeof overrideContents !== 'object' ||
      !Object.keys(overrideContents).length
    ) {
      // If there are no valid overrides, return self
      return this;
    }

    const contents: any = {};
    for (const key of arrays.distinct([
      ...Object.keys(this.contents),
      ...Object.keys(overrideContents),
    ])) {
      let contentsForKey = this.contents[key];
      const overrideContentsForKey = overrideContents[key];

      // If there are override contents for the key, clone and merge otherwise use base contents
      if (overrideContentsForKey) {
        // Clone and merge only if base contents and override contents are of type object otherwise just override
        if (typeof contentsForKey === 'object' && typeof overrideContentsForKey === 'object') {
          contentsForKey = objects.deepClone(contentsForKey);
          this.mergeContents(contentsForKey, overrideContentsForKey);
        } else {
          contentsForKey = overrideContentsForKey;
        }
      }

      contents[key] = contentsForKey;
    }

    return new ConfigurationModel(contents, this.keys, this.overrides);
  }

  merge(...others: ConfigurationModel[]): ConfigurationModel {
    const contents = objects.deepClone(this.contents);
    const overrides = objects.deepClone(this.overrides);
    const keys = [...this.keys];

    for (const other of others) {
      this.mergeContents(contents, other.contents);

      for (const otherOverride of other.overrides) {
        const [override] = overrides.filter((o) =>
          arrays.equals(o.identifiers, otherOverride.identifiers),
        );
        if (override) {
          this.mergeContents(override.contents, otherOverride.contents);
        } else {
          overrides.push(objects.deepClone(otherOverride));
        }
      }
      for (const key of other.keys) {
        if (keys.indexOf(key) === -1) {
          keys.push(key);
        }
      }
    }
    return new ConfigurationModel(contents, keys, overrides);
  }

  freeze(): ConfigurationModel {
    this.isFrozen = true;
    return this;
  }

  private mergeContents(source: any, target: any): void {
    for (const key of Object.keys(target)) {
      if (key in source) {
        if (isObject(source[key]) && isObject(target[key])) {
          this.mergeContents(source[key], target[key]);
          continue;
        }
      }
      source[key] = objects.deepClone(target[key]);
    }
  }

  private checkAndFreeze<T>(data: T): T {
    if (this.isFrozen && !Object.isFrozen(data)) {
      return objects.deepFreeze(data);
    }
    return data;
  }

  private getContentsForOverrideIdentifer(identifier: string): any {
    for (const override of this.overrides) {
      if (override.identifiers.indexOf(identifier) !== -1) {
        return override.contents;
      }
    }
    return null;
  }
  // Update methods

  public setValue(key: string, value: any) {
    this.addKey(key);
    addToValueTree(this.contents, key, value, (e) => {
      throw new Error(e);
    });
  }

  public removeValue(key: string): void {
    if (this.removeKey(key)) {
      removeFromValueTree(this.contents, key);
    }
  }

  private addKey(key: string): void {
    let index = this.keys.length;
    for (let i = 0; i < index; i++) {
      if (key.indexOf(this.keys[i]) === 0) {
        index = i;
      }
    }
    this.keys.splice(index, 1, key);
  }

  private removeKey(key: string): boolean {
    const index = this.keys.indexOf(key);
    if (index !== -1) {
      this.keys.splice(index, 1);
      return true;
    }
    return false;
  }
}

export class Configuration {
  private _workspaceConsolidatedConfiguration: ConfigurationModel | null = null;

  constructor(
    private _defaultConfiguration: ConfigurationModel,
    private _workspaceConfiguration: ConfigurationModel = new ConfigurationModel(),
    private _memoryConfiguration: ConfigurationModel = new ConfigurationModel(),
    private _freeze: boolean = true,
  ) {}

  getValue(section: string | undefined): any {
    const consolidateConfigurationModel = this.getConsolidateConfigurationModel();
    return consolidateConfigurationModel.getValue(section);
  }

  updateValue(key: string, value: any): void {
    const memoryConfiguration: ConfigurationModel | undefined = this._memoryConfiguration;

    if (value === undefined) {
      memoryConfiguration.removeValue(key);
    } else {
      memoryConfiguration.setValue(key, value);
    }
  }

  inspect<C>(key: string): IConfigurationValue<C> {
    const consolidateConfigurationModel = this.getConsolidateConfigurationModel();

    const value = consolidateConfigurationModel.getValue<C>(key);

    return {
      value,
    };
  }

  get defaults(): ConfigurationModel {
    return this._defaultConfiguration;
  }

  private getConsolidateConfigurationModel(): ConfigurationModel {
    if (!this._workspaceConsolidatedConfiguration) {
      this._workspaceConsolidatedConfiguration = this._defaultConfiguration.merge(
        this._workspaceConfiguration,
        this._memoryConfiguration,
      );
      if (this._freeze) {
        this._workspaceConfiguration = this._workspaceConfiguration.freeze();
      }
    }
    return this._workspaceConsolidatedConfiguration;
  }

  toData(): IConfigurationData {
    return {
      defaults: {
        contents: this._defaultConfiguration.contents,
        overrides: this._defaultConfiguration.overrides,
        keys: this._defaultConfiguration.keys,
      },
    };
  }

  // static parse(data: IConfigurationData): Configuration {
  //   const defaultConfiguration = this.parseConfigurationModel(data.defaults);
  //   const userConfiguration = this.parseConfigurationModel(data.user);
  //   const workspaceConfiguration = this.parseConfigurationModel(data.workspace);
  //   const folders: ResourceMap<ConfigurationModel> = data.folders.reduce((result, value) => {
  //     result.set(URI.revive(value[0]), this.parseConfigurationModel(value[1]));
  //     return result;
  //   }, new ResourceMap<ConfigurationModel>());
  //   return new Configuration(defaultConfiguration, userConfiguration, new ConfigurationModel(), workspaceConfiguration, folders, new ConfigurationModel(), new ResourceMap<ConfigurationModel>(), false);
  // }

  private static parseConfigurationModel(model: IConfigurationModel): ConfigurationModel {
    return new ConfigurationModel(model.contents, model.keys, model.overrides).freeze();
  }
}

export class DefaultConfigurationModel extends ConfigurationModel {
  constructor() {
    const contents = getDefaultValues();
    const keys = getConfigurationKeys();
    const overrides: IOverrides[] = [];
    for (const key of Object.keys(contents)) {
      if (OVERRIDE_PROPERTY_PATTERN.test(key)) {
        overrides.push({
          identifiers: [overrideIdentifierFromKey(key).trim()],
          keys: Object.keys(contents[key]),
          contents: toValuesTree(contents[key], (message) =>
            console.error(`Conflict in default settings file: ${message}`),
          ),
        });
      }
    }
    super(contents, keys, overrides);
  }
}
