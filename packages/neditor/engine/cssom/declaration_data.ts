import { PropertyValue } from './property_value';
import { PropertyKey } from './property_definitions';

export type PropertyValues = Map<PropertyKey, PropertyValue>

export abstract class DeclarationData {
  // abstract IsSupportedPropertyKey(key: PropertyKey): boolean
  abstract GetPropertyValue(key: PropertyKey): PropertyValue | null
  abstract SetPropertyValue(key: PropertyKey, property_value: PropertyValue|null): void
}
