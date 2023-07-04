// TODO: Add more units.
// When adding a unit, please ADD_ASSIGN the name in kUnitNames im length_value.cc.
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { DCHECK_EQ } from '@neditor/core/base/check_op';
import { baseGetTypeId, TypeId } from '../base/type_id';

export enum LengthUnit {
  kPixelsUnit,
  kAbsoluteUnitMax =
    kPixelsUnit,  // The units above are absolute, the rest are relative.
  kFontSizesAkaEmUnit,
  kRootElementFontSizesAkaRemUnit,
  kViewportWidthPercentsAkaVwUnit,
  kViewportHeightPercentsAkaVhUnit,
}

// Represents distance or size.
// Applies to properties such as left, width, font-size, etc.
// See https://www.w3.org/TR/css3-values/#lengths for details.
export class LengthValue extends PropertyValue {
  private value_: number;
  private unit_: LengthUnit;
  constructor(value: number, unit: LengthUnit) {
    super();
    this.value_ = value;
    this.unit_ = unit;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitLength(this);
  }

  value() { return this.value_; }
  unit() { return this.unit_; }
  IsUnitRelative() { return this.unit_ > LengthUnit.kAbsoluteUnitMax; }

  ToString(): string {
    const kUnitNames = ['px', 'em', 'rem', 'vw', 'vh',];
    return `${this.value_}${kUnitNames[this.unit_]}`;
  }

  EQ(other: LengthValue) {
    return this.value_ == other.value_ && this.unit_ == other.unit_;
  }

  GE(other: LengthValue) {
    DCHECK_EQ(this.unit_, other.unit_,
      'Value larger comparison of length values ',
      'can only be done for matching unit types');
    return this.value_ >= other.value_;
  }

  LE(other: LengthValue) {
    DCHECK_EQ(this.unit_, other.unit_,
      'Value smaller comparison of length ',
      'values can only be done for matching ',
      'unit types');
    return this.value_ <= other.value_;
  }
  GetTypeId(): TypeId {
    return baseGetTypeId(LengthValue);
  }

}
