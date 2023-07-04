// Percentage values are always relative to another value, for example a length.
// Each property that allows percentages also defines the value to which
// the percentage refers.
//   https://www.w3.org/TR/css3-values/#percentages
import { PropertyValue } from './property_value';
import type { PropertyValueVisitor } from './property_value_visitor';
import { toPercentage } from '@neditor/core/base/common/number';
import { baseGetTypeId } from '../base/type_id';

export class PercentageValue extends PropertyValue {
  value_: number;

  // A |value| is a normalized factor, where 1 means 100%.
  constructor(value: number) {
    super();
    this.value_ = value;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitPercentage(this);
  }

  // Returns a normalized factor, where 1 means 100%.
  value(): number { return this.value_; }

  ToString(): string {
    return toPercentage(this.value_);
  }

  EQ(other: PercentageValue) {
    return this.value_ === other.value_;
  }
  GetTypeId(): number {
    return baseGetTypeId(PercentageValue)
  }
}
