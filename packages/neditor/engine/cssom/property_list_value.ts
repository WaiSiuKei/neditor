import { ScopedRefListValue } from './scoped_ref_list_value';
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId, TypeId } from '../base/type_id';

export type PropertyListValueBuilder = PropertyValue[]

export class PropertyListValue extends ScopedRefListValue<PropertyValue> {
  constructor(value: PropertyValue[]) {super(value);}

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitPropertyList(this);
  }

  ToString(): string {
    return this.value().map(value => value.ToString()).join(', ');
  }
  GetTypeId(): TypeId {
    return baseGetTypeId(PropertyListValue)
  }
};
