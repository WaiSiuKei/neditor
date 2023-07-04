// Represents a dimensionless value.
//   https://www.w3.org/TR/css3-values/#integers

import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId } from '../base/type_id';

export class IntegerValue extends PropertyValue {
  value_: number;
  constructor(value: number) {
    super();
    this.value_ = value;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitInteger(this);
  }

  value() { return this.value_; }

  ToString() {
    return this.value_.toString();
  }
  GetTypeId(): number {
    return baseGetTypeId(IntegerValue);
  }
  EQ(other: PropertyValue): boolean {
    if (!(other instanceof IntegerValue)) return false;
    return this.value_ === other.value_;
  }
}

