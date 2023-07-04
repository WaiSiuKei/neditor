// Specifies a translation by the given amount in the X, Y or Z direction.
//   https://www.w3.org/TR/css-transforms-1/#funcdef-translatex
//   https://www.w3.org/TR/css-transforms-1/#funcdef-translatey
//   https://www.w3.org/TR/css-transforms-1/#funcdef-translatez
import { Trait, TransformFunction } from './transform_function';
import { PropertyValue } from './property_value';
import { DCHECK } from '@neditor/core/base/check';
import { TransformFunctionVisitor } from './transform_function_visitor';
import { LengthUnit, LengthValue } from './length_value';
import { baseGetTypeId } from '../base/type_id';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { PercentageValue } from './percentage_value';
import { CalcValue } from './calc_value';
import { DCHECK_EQ } from '@neditor/core/base/check_op';
import { LayoutUnit } from '../layout/layout_unit';
import { SizeF } from '../math/size_f';
import { TranslateMatrix } from '../math/transform_2d';
import { ERROR, LOG } from '@neditor/core/base/logging';
import { Matrix3F } from '../math/matrix3_f';

export enum Axis {
  kXAxis,
  kYAxis,
  kZAxis,
};

export enum OffsetType {
  kCalc,
  kLength,
  kPercentage,
};

export class TranslateFunction extends TransformFunction {
  private axis_: Axis;
  private offset_: PropertyValue;

  constructor(
    axis: Axis,
    offset: PropertyValue,
  ) {
    super();
    this.axis_ = axis;
    this.offset_ = offset;
    DCHECK(offset);
    if (this.offset_type() == OffsetType.kLength && this.offset_as_length().IsUnitRelative()) {
      this.traits_ = Trait.kTraitUsesRelativeUnits;
    }
  }

  Accept(visitor: TransformFunctionVisitor) {
    visitor.VisitTranslate(this);
  }

  offset_type() {
    if (this.offset_.GetTypeId() == baseGetTypeId(LengthValue)) {
      return OffsetType.kLength;
    } else if (this.offset_.GetTypeId() == baseGetTypeId(PercentageValue)) {
      return OffsetType.kPercentage;
    } else if (this.offset_.GetTypeId() == baseGetTypeId(CalcValue)) {
      return OffsetType.kCalc;
    } else {
      NOTREACHED();
    }
  }

  offset_as_length(): LengthValue {
    DCHECK_EQ(OffsetType.kLength, this.offset_type());
    return this.offset_ as LengthValue;
  }
  offset_as_percentage() {
    DCHECK_EQ(OffsetType.kPercentage, this.offset_type());
    return this.offset_ as PercentageValue;
  }
  offset_as_calc() {
    DCHECK_EQ(OffsetType.kCalc, this.offset_type());
    return this.offset_ as CalcValue;
  }

  // The following two functions will return the length/percentage components
  // of the translation, regardless of whether it is a LengthValue,
  // PercentageValue or CalcValue.
  // length_component_in_pixels() can only be called if length units are in
  // pixels.
  length_component_in_pixels(): number {
    switch (this.offset_type()) {
      case OffsetType.kLength:
        DCHECK_EQ(LengthUnit.kPixelsUnit, this.offset_as_length().unit());
        return this.offset_as_length().value();
      case OffsetType.kPercentage:
        return 0.0;
      case OffsetType.kCalc:
        DCHECK_EQ(LengthUnit.kPixelsUnit, this.offset_as_calc().length_value().unit());
        return this.offset_as_calc().length_value().value();
    }
    NOTREACHED();
  }
  percentage_component(): number {
    switch (this.offset_type()) {
      case OffsetType.kLength:
        return 0.0;
      case  OffsetType.kPercentage:
        return this.offset_as_percentage().value();
      case  OffsetType.kCalc:
        return this.offset_as_calc().percentage_value().value();
    }
    NOTREACHED();
  }

  axis(): Axis { return this.axis_; }

  ToString() {
    let axis = ' ';
    switch (this.axis_) {
      case Axis.kXAxis:
        axis = 'X';
        break;
      case  Axis.kYAxis:
        axis = 'Y';
        break;
      case  Axis.kZAxis:
        axis = 'Z';
        break;
    }
    let result = 'translate';
    result += (axis);
    result += ('(');
    if (this.offset_) {
      result += (this.offset_.ToString());
    }
    result += (')');
    return result;
  }

  ToMatrix(used_size: SizeF/*,
      const scoped_refptr<ui_navigation::NavItem>& used_ui_nav_focus*/) {
    switch (this.axis_) {
      case Axis.kXAxis:
        return TranslateMatrix(this.length_component_in_pixels() +
          this.percentage_component() * used_size.width(),
          0.0);
      case Axis.kYAxis:
        return TranslateMatrix(0.0,
          this.length_component_in_pixels() +
          this.percentage_component() * used_size.height());
      case Axis.kZAxis:
        if (this.length_component_in_pixels() != 0 ||
          this.percentage_component() != 0) {
          LOG(ERROR, 'translateZ is currently a noop in Cobalt.');
        }
        break;
    }
    return Matrix3F.Identity();
  }

  EQ(other: TranslateFunction): boolean {
    NOTIMPLEMENTED();
    // return this.offset_.EQ(other.offset_) && this.axis_ == other.axis_;
  }
}
