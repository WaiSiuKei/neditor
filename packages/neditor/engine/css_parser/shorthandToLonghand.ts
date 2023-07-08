import { DeclaredStyleData } from '../cssom/declared_style_data';
import { PropertyKey } from '../cssom/property_definitions';
import { PropertyValue } from '../cssom/property_value';

export function unpack(data: DeclaredStyleData, shorthand: PropertyKey, longhands: PropertyKey[], value: PropertyValue) {
  for (let key of longhands) {
    data.SetPropertyValue(key, value);
  }
}
