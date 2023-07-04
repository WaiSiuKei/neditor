// Represents a sequence of characters delimited by single or double quotes.
// Applies to properties like font-family.
// See https://www.w3.org/TR/css3-values/#strings for details.
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId } from '../base/type_id';

export class StringValue extends PropertyValue {
  private value_: string;

  constructor(value: string) {
    super();
    this.value_ = value;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitString(this);
  }

  value() { return this.value_; }

  ToString() { return '\'' + this.value_ + '\''; }

  EQ(other: StringValue) {
    return this.value_ === other.value_;
  }
  GetTypeId(): number {
    return baseGetTypeId(StringValue);
  }
};
