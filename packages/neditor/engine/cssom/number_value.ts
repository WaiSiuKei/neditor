// Represents a dimensionless value.
//   https://www.w3.org/TR/css3-values/#numeric-types
import { PropertyValue } from './property_value';
import type { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId } from '../base/type_id';

export class NumberValue extends PropertyValue {
  private value_: number;
  constructor(value: number) {
    super();
    this.value_ = value;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitNumber(this);
  }

  value(): number { return this.value_; }

  ToString(): string {
    return this.value_.toString();
  }

  EQ(other: NumberValue): boolean {
    return this.value_ === other.value_;
  }
  GetTypeId(): number {
    return baseGetTypeId(NumberValue)
  }
}

