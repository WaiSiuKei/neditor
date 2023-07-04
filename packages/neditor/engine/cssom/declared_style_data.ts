import { DeclarationData, PropertyValues } from './declaration_data';
import { PropertyValue } from './property_value';
import { GetPropertyInitialValue, GetPropertyName, PropertyKey } from './property_definitions';
import { DCHECK_GT, DCHECK_LE } from '@neditor/core/base/check_op';
import { deepClone } from '@neditor/core/base/common/objects';

export class DeclaredStyleData extends DeclarationData {
  declared_property_values_: PropertyValues = new Map<PropertyKey, PropertyValue>();
  important_properties_ = new Set<PropertyKey>();

  GetPropertyValue(key: PropertyKey): PropertyValue {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);
    if (this.declared_property_values_.has(key)) {
      return this.declared_property_values_.get(key)!;
    }
    return GetPropertyInitialValue(key);
  }

  SetPropertyValue(key: PropertyKey, property_value: PropertyValue | null): void {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);
    if (property_value) {
      this.declared_property_values_.set(key, property_value);
    } else {
      this.declared_property_values_.delete(key);

    }
  }
  GetPropertyValueString(key: PropertyKey): string {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);
    if (this.declared_property_values_.has(key)) {
      return this.declared_property_values_.get(key)!.ToString();
    }
    return '';
  }

  declared_property_values() {
    return this.declared_property_values_;
  }
  IsDeclaredPropertyImportant(key: PropertyKey) {
    return this.important_properties_.has(key);
  }

  AssignFrom(rhs: DeclaredStyleData) {
    this.declared_property_values_ = new Map<PropertyKey, PropertyValue>(rhs.declared_property_values());
    this.important_properties_ = new Set<PropertyKey>(rhs.important_properties_);
  }

  get align_content(): PropertyValue {return this.GetPropertyValue(PropertyKey.kAlignContentProperty);}
  set align_content(val: PropertyValue | null) { this.SetPropertyValue(PropertyKey.kAlignContentProperty, val);}

  toString() {
    const keys = Array.from(this.declared_property_values_.keys());
    const sortedKeys = keys.sort();
    let pairs: string[] = [];
    for (let key of sortedKeys) {
      const value = this.GetPropertyValueString(key);
      pairs.push(`${GetPropertyName(key)}:${value}`);
    }
    return pairs.join(';');
  }
}
