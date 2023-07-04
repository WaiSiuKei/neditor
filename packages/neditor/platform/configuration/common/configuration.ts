import { createDecorator } from '@neditor/core/platform/instantiation/common/instantiation';
import { configurationRegistry } from './configurationRegistry';
import { URI } from "@neditor/core/base/common/uri";
import { Event } from "@neditor/core/base/common/event";

export const IConfigurationService = createDecorator<IConfigurationService>('configurationService');

export interface IConfigurationModel {
  contents: any;
  keys: string[];
  overrides: IOverrides[];
}

export interface IOverrides {
  keys: string[];
  contents: any;
  identifiers: string[];
}

export const enum ConfigurationTarget {
  USER = 1,
  WORKSPACE,
  DEFAULT,
  MEMORY,
}

export interface IConfigurationValue<T> {
  // readonly defaultValue?: T;
  // readonly userValue?: T;
  // readonly userLocalValue?: T;
  // readonly userRemoteValue?: T;
  // readonly workspaceValue?: T;
  // readonly workspaceFolderValue?: T;
  // readonly memoryValue?: T;
  readonly value?: T;
  // readonly default?: { value?: T, override?: T };
  // readonly user?: { value?: T, override?: T };
  // readonly userLocal?: { value?: T, override?: T };
  // readonly userRemote?: { value?: T, override?: T };
  // readonly workspace?: { value?: T, override?: T };
  // readonly workspaceFolder?: { value?: T, override?: T };
  // readonly memory?: { value?: T, override?: T };

  // readonly overrideIdentifiers?: string[];
}

export interface IConfigurationData {
  defaults: IConfigurationModel;
  // user: IConfigurationModel;
  // workspace: IConfigurationModel;
  // folders: [UriComponents, IConfigurationModel][];
}

export interface IConfigurationService {
  readonly _serviceBrand: undefined;

  onDidChangeConfiguration: Event<IConfigurationChangeEvent>;

  // getConfigurationData(): IConfigurationData | null;
  getValue<T>(): T;
  getValue<T>(section: string): T;
  updateValue(key: string, value: any): Promise<void>;
}

export interface IConfigurationChange {
  keys: string[];
  overrides: [string, string[]][];
}

export interface IConfigurationOverrides {
  overrideIdentifier?: string | null;
  resource?: URI | null;
}

export interface IConfigurationChangeEvent {

  readonly source: ConfigurationTarget;
  readonly affectedKeys: string[];
  readonly change: IConfigurationChange;

  affectsConfiguration(configuration: string, overrides?: IConfigurationOverrides): boolean;

  // Following data is used for telemetry
  readonly sourceConfig: any;
}

/**
 * A helper function to get the configuration value with a specific settings path (e.g. config.some.setting)
 */
export function getConfigurationValue<T>(config: any, settingPath: string, defaultValue?: T): T {
  function accessSetting(config: any, path: string[]): any {
    let current = config;
    for (const component of path) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }
      current = current[component];
    }
    return <T>current;
  }

  const path = settingPath.split('.');
  const result = accessSetting(config, path);

  return typeof result === 'undefined' ? defaultValue : result;
}

export function toValuesTree(
  properties: { [qualifiedKey: string]: any },
  conflictReporter: (message: string) => void,
): any {
  const root = Object.create(null);

  for (const key in properties) {
    addToValueTree(root, key, properties[key], conflictReporter);
  }

  return root;
}

export function addToValueTree(
  settingsTreeRoot: any,
  key: string,
  value: any,
  conflictReporter: (message: string) => void,
): void {
  const segments = key.split('.');
  const last = segments.pop()!;

  let curr = settingsTreeRoot;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    let obj = curr[s];
    switch (typeof obj) {
      case 'undefined':
        obj = curr[s] = Object.create(null);
        break;
      case 'object':
        break;
      default:
        conflictReporter(
          `Ignoring ${key} as ${segments.slice(0, i + 1).join('.')} is ${JSON.stringify(obj)}`,
        );
        return;
    }
    curr = obj;
  }

  if (typeof curr === 'object' && curr !== null) {
    try {
      curr[last] = value; // workaround https://github.com/microsoft/vscode/issues/13606
    } catch (e) {
      conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
    }
  } else {
    conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
  }
}

export function removeFromValueTree(valueTree: any, key: string): void {
  const segments = key.split('.');
  doRemoveFromValueTree(valueTree, segments);
}

function doRemoveFromValueTree(valueTree: any, segments: string[]): void {
  const first = segments.shift()!;
  if (segments.length === 0) {
    // Reached last segment
    delete valueTree[first];
    return;
  }

  if (Object.keys(valueTree).indexOf(first) !== -1) {
    const value = valueTree[first];
    if (typeof value === 'object' && !Array.isArray(value)) {
      doRemoveFromValueTree(value, segments);
      if (Object.keys(value).length === 0) {
        delete valueTree[first];
      }
    }
  }
}

export function getConfigurationKeys(): string[] {
  const properties = configurationRegistry.getConfigurationProperties();
  return Object.keys(properties);
}

export function getDefaultValues(): any {
  const valueTreeRoot: any = Object.create(null);
  const properties = configurationRegistry.getConfigurationProperties();

  for (const key in properties) {
    const value = properties[key].default;
    addToValueTree(valueTreeRoot, key, value, (message) =>
      console.error(`Conflict in default settings: ${message}`),
    );
  }

  return valueTreeRoot;
}

const OVERRIDE_PROPERTY = '\\[.*\\]$';
export const OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);

export function overrideIdentifierFromKey(key: string): string {
  return key.substring(1, key.length - 1);
}
