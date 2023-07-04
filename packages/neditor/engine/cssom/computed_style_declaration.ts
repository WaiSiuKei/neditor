import { StyleDeclaration } from './style_declaration';
import { ComputedStyleData } from './computed_style_data';
import { DOMException, ExceptionCode } from '../dom/dom_exception';
import { PropertyValue } from './property_value';
import { GetPropertyName, PropertyKey } from './property_definitions';
import { DCHECK_LE } from '@neditor/core/base/check_op';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { DCHECK } from '@neditor/core/base/check';

export class ComputedStyleDeclaration extends StyleDeclaration {
  data_: ComputedStyleData | null = null;
  data_with_inherited_properties_: ComputedStyleData | null = null;

  data() {return this.data_!;}

  setProperty(property_name: string, property_value: string): void {
    DOMException.Raise(ExceptionCode.kInvalidAccessErr);
  }

  HasInheritedProperties(): boolean {
    return !!this.data_with_inherited_properties_;
  }

  GetInheritedPropertyValueReference(key: PropertyKey): PropertyValue {
    if (!this.data_with_inherited_properties_) {
      throw new Error('500');
    }
    return this.data_with_inherited_properties_.GetPropertyValueReference(key);
  }

  SetData(data: ComputedStyleData) {
    this.data_ = data;
    // After setting |data_|, |data_with_inherited_properties_| needs to be
    // updated. It may have changed.
    this.UpdateInheritedData();
  }

  UpdateInheritedData() {
    if (!this.data_) {
      // If there's no data, then there can be no data with inherited properties.
      this.data_with_inherited_properties_ = null;
    } else if (this.data_.has_declared_inherited_properties()) {
      // Otherwise, if the data has inherited properties, then it's also the first
      // data with inherited properties.
      this.data_with_inherited_properties_ = this.data_;
    } else {
      // Otherwise, |data_with_inherited_properties_| should be set to the parent
      // computed style's |data_with_inherited_properties_|. This is because the
      // updates always cascade down the tree and the parent is guaranteed to
      // have already been updated when the child is updated.
      let parent_computed_style_declaration = this.data_.GetParentComputedStyleDeclaration();
      if (parent_computed_style_declaration) {
        this.data_with_inherited_properties_ =
          parent_computed_style_declaration.data_with_inherited_properties_;
      } else {
        this.data_with_inherited_properties_ = null;
      }
    }
  }
  GetDeclaredPropertyValueStringByKey(key: PropertyKey): string {
    if (key > PropertyKey.kMaxLonghandPropertyKey) {
      // Shorthand properties are never directly stored as declared properties,
      // but are expanded into their longhand property components during parsing.
      // TODO: Implement serialization of css values, see
      // https://www.w3.org/TR/cssom-1/#serializing-css-values
      DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
      NOTIMPLEMENTED();
      DLOG(WARNING, 'Unsupported property query for "', GetPropertyName(key)
        , '": Returning of property value strings is not ',
        'supported for shorthand properties.');
      return '';
    }
    DCHECK(this.data_);
    const property_value = this.data_!.GetPropertyValueReference(key);
    DCHECK(property_value);
    return property_value.ToString();
  }
}
