// See https://www.w3.org/TR/css3-fonts/#unicode-range-desc for details.
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId, TypeId } from '../base/type_id';

export class UnicodeRangeValue extends PropertyValue {
  private start_: number;
  private end_: number;
  constructor(
    start: number,
    end: number,
  ) {
    super();
    this.start_ = start;
    this.end_ = end;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitUnicodeRange(this);
  }

  start() { return this.start_; }
  end() { return this.end_; }

  ToString() {
    if (this.start_ == this.end_) {
      return `U+${this.start_.toString(16)}`;
    } else {
      return `U+${this.start_.toString(16)}-${this.end_.toString(16)}`;
    }
  }

  EQ(other: UnicodeRangeValue): boolean {
    if (!(other instanceof UnicodeRangeValue)) return false;
    return this.start_ == other.start_ && this.end_ == other.end_;
  }

  IsValid() {
    return this.start_ <= this.end_;
  }
  GetTypeId(): TypeId {
    return baseGetTypeId(UnicodeRangeValue);
  }
}

