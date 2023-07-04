import { IJSONSchema } from '@neditor/core/base/common/jsonSchema';
import { isNil, isUndefined } from '@neditor/core/base/common/type';
import { OVERRIDE_PROPERTY_PATTERN } from './configuration';
import { IStringDictionary } from '@neditor/core/base/common/collections';
import { globals } from '@neditor/core/base/common/platform';

export const enum ConfigurationScope {
  /**
   * Application specific configuration, which can be configured only in local user settings.
   */
  APPLICATION = 1,
  // /**
  //  * Machine specific configuration, which can be configured only in user settings.
  //  */
  // MACHINE,
  // /**
  //  * Window specific configuration, which can be configured in the user or workspace settings.
  //  */
  // WINDOW,
  // /**
  //  * Resource specific configuration, which can be configured in the user, workspace or folder settings.
  //  */
  // RESOURCE,
}

type SettingProperties = { [key: string]: any };

export const allSettings: { properties: SettingProperties; patternProperties: SettingProperties } =
  { properties: {}, patternProperties: {} };
export const applicationSettings: {
  properties: SettingProperties;
  patternProperties: SettingProperties;
} = { properties: {}, patternProperties: {} };

export interface IConfigurationPropertySchema extends IJSONSchema {
  scope?: ConfigurationScope;
  included?: boolean;
  tags?: string[];
  disallowSyncIgnore?: boolean;
  enumItemLabels?: string[];
}

export interface IConfigurationNode {
  id?: string;
  order?: number;
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: { [path: string]: IConfigurationPropertySchema };
  allOf?: IConfigurationNode[];
  scope?: ConfigurationScope;
}

class ConfigurationRegistry {
  private readonly defaultValues: IStringDictionary<any>;
  private readonly configurationProperties: { [qualifiedKey: string]: IJSONSchema };
  private readonly excludedConfigurationProperties: { [qualifiedKey: string]: IJSONSchema };

  constructor() {
    this.defaultValues = {};
    this.configurationProperties = {};
    this.excludedConfigurationProperties = {};
  }

  getConfigurationProperties(): { [qualifiedKey: string]: IConfigurationPropertySchema } {
    return this.configurationProperties;
  }

  public registerConfiguration(configuration: IConfigurationNode, validate = true): void {
    this.registerConfigurations([configuration], validate);
  }

  public registerConfigurations(configurations: IConfigurationNode[], validate = true): void {
    const properties: string[] = [];
    configurations.forEach((configuration) => {
      properties.push(...this.validateAndRegisterProperties(configuration, validate)); // fills in defaults
      this.registerJSONConfiguration(configuration);
    });

    // contributionRegistry.registerSchema(resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
    // this._onDidSchemaChange.fire();
    // this._onDidUpdateConfiguration.fire(properties);
  }

  private validateAndRegisterProperties(
    configuration: IConfigurationNode,
    validate = true,
    scope: ConfigurationScope = ConfigurationScope.APPLICATION,
  ): string[] {
    scope = isNil(configuration.scope) ? scope : configuration.scope;
    const propertyKeys: string[] = [];
    const properties = configuration.properties;
    if (properties) {
      for (const key in properties) {
        if (validate && validateProperty(key)) {
          delete properties[key];
          continue;
        }

        const property = properties[key];

        // update default value
        this.updatePropertyDefaultValue(key, property);

        // update scope
        if (OVERRIDE_PROPERTY_PATTERN.test(key)) {
          property.scope = undefined; // No scope for overridable properties `[${identifier}]`
        } else {
          property.scope = isNil(property.scope) ? scope : property.scope;
        }

        // Add to properties maps
        // Property is included by default if 'included' is unspecified
        if (properties[key].hasOwnProperty('included') && !properties[key].included) {
          this.excludedConfigurationProperties[key] = properties[key];
          delete properties[key];
          continue;
        } else {
          this.configurationProperties[key] = properties[key];
        }

        if (!properties[key].deprecationMessage && properties[key].markdownDeprecationMessage) {
          // If not set, default deprecationMessage to the markdown source
          properties[key].deprecationMessage = properties[key].markdownDeprecationMessage;
        }

        propertyKeys.push(key);
      }
    }
    const subNodes = configuration.allOf;
    if (subNodes) {
      for (const node of subNodes) {
        propertyKeys.push(...this.validateAndRegisterProperties(node, validate, scope));
      }
    }
    return propertyKeys;
  }

  private updatePropertyDefaultValue(key: string, property: IConfigurationPropertySchema): void {
    let defaultValue = this.defaultValues[key];
    if (isUndefined(defaultValue)) {
      defaultValue = property.default;
    }
    if (isUndefined(defaultValue)) {
      defaultValue = getDefaultValue(property.type);
    }
    property.default = defaultValue;
  }

  private registerJSONConfiguration(configuration: IConfigurationNode) {
    const register = (configuration: IConfigurationNode) => {
      const properties = configuration.properties;
      if (properties) {
        for (const key in properties) {
          this.updateSchema(key, properties[key]);
        }
      }
      const subNodes = configuration.allOf;
      if (subNodes) {
        subNodes.forEach(register);
      }
    };
    register(configuration);
  }

  private updateSchema(key: string, property: IConfigurationPropertySchema): void {
    allSettings.properties[key] = property;
    switch (property.scope) {
      case ConfigurationScope.APPLICATION:
        applicationSettings.properties[key] = property;
        break;
    }
  }
}

const key = 'configurationRegistry';
let instance: ConfigurationRegistry = Reflect.get(globals, key);
if (!instance) {
  instance = new ConfigurationRegistry();
  Reflect.set(globals, key, instance);
}
export const configurationRegistry = instance;

export function validateProperty(property: string): string | null {
  if (!property.trim()) {
    return 'Cannot register an empty property';
  }
  if (OVERRIDE_PROPERTY_PATTERN.test(property)) {
    return `Cannot register '${property}. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.`;
  }
  if (configurationRegistry.getConfigurationProperties()[property] !== undefined) {
    return `Cannot register '${property}'. This property is already registered.`;
  }
  return null;
}

export function getDefaultValue(type: string | string[] | undefined): any {
  const t = Array.isArray(type) ? (<string[]>type)[0] : <string>type;
  switch (t) {
    case 'boolean':
      return false;
    case 'integer':
    case 'number':
      return 0;
    case 'string':
      return '';
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}
