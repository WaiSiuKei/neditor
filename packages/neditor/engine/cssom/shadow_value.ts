import { PropertyValue } from './property_value';
import { RGBAColorValue } from './rgba_color_value';
import { LengthValue } from './length_value';
import { DCHECK_LE } from '@neditor/core/base/check_op';
import { PropertyValueVisitor } from './property_value_visitor';
import { kInsetKeywordName } from './keyword_names';
import { TypeId, baseGetTypeId as baseGetTypeId } from '../base/type_id';

export enum LengthsIndex {
  kLengthsIndexOffsetX,
  kLengthsIndexOffsetY,
  kLengthsIndexBlurRadius,
  kLengthsIndexSpreadRadius,
  kMaxLengths,
}

export class ShadowValue extends PropertyValue {
  private lengths_: [LengthValue, LengthValue, LengthValue, LengthValue];
  private color_: RGBAColorValue;
  private has_inset_: boolean;
  // Defines the meaning of the value for each index in the lengths_ array.
  constructor(
    lengths: LengthValue[],
    color: RGBAColorValue,
    has_inset: boolean,
  ) {
    super();
    DCHECK_LE(lengths.length, LengthsIndex.kMaxLengths);
    // @ts-ignore
    this.lengths_ = lengths.slice();
    this.color_ = color;
    this.has_inset_ = has_inset;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitShadow(this);
  }

  lengths(): LengthValue[] { return this.lengths_; }

  offset_x(): LengthValue {
    return this.lengths_[LengthsIndex.kLengthsIndexOffsetX];
  }
  offset_y(): LengthValue {
    return this.lengths_[LengthsIndex.kLengthsIndexOffsetY];
  }
  blur_radius(): LengthValue {
    return this.lengths_[LengthsIndex.kLengthsIndexBlurRadius];
  }
  spread_radius(): LengthValue {
    return this.lengths_[LengthsIndex.kLengthsIndexSpreadRadius];
  }

  color(): RGBAColorValue { return this.color_; }

  has_inset(): boolean { return this.has_inset_; }

  ToString(): string {
    let result = '';
    for (let i = 0; i < LengthsIndex.kMaxLengths; ++i) {
      if (this.lengths_[i]) {
        if (result.length) result += (' ');
        result += (this.lengths_[i].ToString());
      }
    }

    if (this.color_) {
      if (result.length) result += (' ');
      result += (this.color_.ToString());
    }

    if (this.has_inset_) {
      if (!result.length) result += (' ');
      result += (kInsetKeywordName);
    }

    return result;
  }

  EQ(other: ShadowValue): boolean {
    for (let i = 0; i < LengthsIndex.kMaxLengths; ++i) {
      if (!this.lengths_[i] != !other.lengths_[i]) {
        return false;
      }
      if (this.lengths_[i] && !(this.lengths_[i].EQ(other.lengths_[i]))) {
        return false;
      }
    }

    return this.color_.EQ(other.color_) && this.has_inset_ == other.has_inset_;
  }
  GetTypeId(): TypeId {
    return baseGetTypeId(ShadowValue);
  }
}
