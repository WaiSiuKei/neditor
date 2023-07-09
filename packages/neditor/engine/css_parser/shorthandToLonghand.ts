import { DeclaredStyleData } from '../cssom/declared_style_data';
import { PropertyKey } from '../cssom/property_definitions';
import { PropertyValue } from '../cssom/property_value';

export function unpack(data: DeclaredStyleData, key: PropertyKey, value: PropertyValue) {
  const longhands = shorthandToLonghands.get(key);
  if (!longhands) return false;
  for (let key of longhands) {
    data.SetPropertyValue(key, value);
  }
  return true;
}

const shorthandToLonghands = new Map<PropertyKey, PropertyKey[]>();

function register(shorthand: PropertyKey, longhands: PropertyKey[]) {
  shorthandToLonghands.set(shorthand, longhands);
}

register(PropertyKey.kBorderColorProperty,
  [
    PropertyKey.kBorderTopColorProperty,
    PropertyKey.kBorderRightColorProperty,
    PropertyKey.kBorderBottomColorProperty,
    PropertyKey.kBorderLeftColorProperty,
  ]);

register(PropertyKey.kBorderStyleProperty,
  [
    PropertyKey.kBorderTopStyleProperty,
    PropertyKey.kBorderRightStyleProperty,
    PropertyKey.kBorderBottomStyleProperty,
    PropertyKey.kBorderLeftStyleProperty,
  ]);

register(PropertyKey.kBorderWidthProperty,
  [
    PropertyKey.kBorderTopWidthProperty,
    PropertyKey.kBorderRightWidthProperty,
    PropertyKey.kBorderBottomWidthProperty,
    PropertyKey.kBorderLeftWidthProperty,
  ]);

register(PropertyKey.kPaddingProperty,
  [
    PropertyKey.kPaddingTopProperty,
    PropertyKey.kPaddingRightProperty,
    PropertyKey.kPaddingBottomProperty,
    PropertyKey.kPaddingLeftProperty,
  ]);
