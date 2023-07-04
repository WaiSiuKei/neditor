// Represents the result of the mathematical calculation it contains, using
// standard operator precedence rules.
// TODO: Implement the complete version of CalcValue. The
// current CalcValue is just a simplified implementation.
//  https://www.w3.org/TR/css3-values/#calc-notation
import { PropertyValue } from './property_value';
import { LengthUnit, LengthValue } from './length_value';
import { PercentageValue } from './percentage_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId } from '../base/type_id';

export class CalcValue extends PropertyValue {

  private length_value_: LengthValue = new LengthValue(0, LengthUnit.kPixelsUnit);
  private percentage_value_: PercentageValue = new PercentageValue(0);

  constructor(length_value: LengthValue)
  constructor(percentage_value: PercentageValue)
  constructor(length_value: LengthValue, percentage_value: PercentageValue)
  constructor(length_value: unknown, percentage_value?: PercentageValue) {
    super();
    if (length_value instanceof LengthValue) {
      this.length_value_ = length_value;
    } else if (length_value instanceof PercentageValue) {
      this.percentage_value_ = length_value;
    }
    if (percentage_value) {
      this.percentage_value_ = percentage_value;
    }
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitCalc(this);
  }

  length_value() {
    return this.length_value_;
  }

  percentage_value() {
    return this.percentage_value_;
  }

  ToString(): string {
    return `calc(${this.length_value_.ToString()} + ${this.percentage_value_.ToString()})`;
  }

  EQ(other: CalcValue): boolean {
    return this.length_value_.EQ(other.length_value_)
      && this.percentage_value_.EQ(other.percentage_value_);
  }
  GetTypeId(): number {
    return baseGetTypeId(CalcValue);
  }
};
