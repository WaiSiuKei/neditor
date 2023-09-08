import type { FontStyleValue } from './font_style_value';
import type { KeywordValue } from './keyword_value';
import type { IntegerValue } from './integer_value';
import type { PathValue } from './path_value';
import type { RGBAColorValue } from './rgba_color_value';
import type { LengthValue } from './length_value';
import type { PropertyValue } from './property_value';
import { DLOG, ERROR } from '@neditor/core/base/logging';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import type { PercentageValue } from './percentage_value';
import type { NumberValue } from './number_value';
import type { TransformPropertyValue } from './transform_property_value';
import type { PropertyListValue } from './property_list_value';
import type { CalcValue } from './calc_value';
import type { StringValue } from './string_value';
import type { FontWeightValue } from './font_weight_value';
import type { ShadowValue } from './shadow_value';
import type { UnicodeRangeValue } from './unicode_range_value';

export abstract class PropertyValueVisitor {
  abstract VisitFontStyle(font_style_value: FontStyleValue): void
  // VisitFontWeight(font_weight_value: FontWeightValue): void
  abstract VisitKeyword(keyword_value: KeywordValue): void
  abstract VisitInteger(integer_value: IntegerValue): void
  abstract VisitRGBAColor(val: RGBAColorValue): void
  abstract VisitLength(val: LengthValue): void
  abstract VisitPath(val: PathValue): void
  abstract VisitPercentage(val: PercentageValue): void
  abstract VisitNumber(val: NumberValue): void
  abstract VisitTransformPropertyValue(val: TransformPropertyValue): void
  abstract VisitPropertyList(val: PropertyListValue): void
  abstract VisitCalc(val: CalcValue): void
  abstract VisitString(val: StringValue): void
  abstract VisitFontWeight(val: FontWeightValue): void
  abstract VisitShadow(val: ShadowValue): void
  abstract VisitUnicodeRange(val: UnicodeRangeValue): void
}

// A convenience class that forwards all methods to |VisitDefault|, thus one can
// derive from this class, implement only the value types that they care about,
// and handle every other value type generically.
export abstract class DefaultingPropertyValueVisitor extends PropertyValueVisitor {
  abstract VisitDefault(property_value: PropertyValue): void
  VisitFontStyle(font_style_value: FontStyleValue): void {
    this.VisitDefault(font_style_value);
  }
  VisitKeyword(keyword_value: KeywordValue): void {
    this.VisitDefault(keyword_value);
  }
  VisitLength(val: LengthValue): void {
    this.VisitDefault(val);
  }
  VisitRGBAColor(val: RGBAColorValue): void {
    this.VisitDefault(val);
  }
  VisitInteger(integer_value: IntegerValue): void {
    this.VisitDefault(integer_value);
  }
  VisitPath(path_value: PathValue): void {
    this.VisitDefault(path_value);
  }
  VisitPercentage(val: PercentageValue): void {
    this.VisitDefault(val);
  }
  VisitNumber(val: NumberValue) {
    this.VisitDefault(val);
  }
  VisitCalc(val: CalcValue): void {
    this.VisitDefault(val);
  }
  VisitPropertyList(val: PropertyListValue): void {
    this.VisitDefault(val);
  }
  VisitTransformPropertyValue(val: TransformPropertyValue): void {
    this.VisitDefault(val);
  }
  VisitString(val: StringValue): void {
    this.VisitDefault(val);
  }
  VisitFontWeight(val: FontWeightValue): void {
    this.VisitDefault(val);
  }
  VisitShadow(val: ShadowValue): void {
    this.VisitDefault(val);
  }
  VisitUnicodeRange(val: UnicodeRangeValue): void {
    this.VisitDefault(val);
  }
}

// A convenience class that implements PropertyValueVisitor with NOTREACHED()
// for each method, thus one can derive from this class, implement only the
// value types that they care about, and then every other value type will
// result in an error.
export class NotReachedPropertyValueVisitor extends DefaultingPropertyValueVisitor {
  VisitDefault(property_value: PropertyValue) {
    DLOG(ERROR, 'Unsupported property value: ', property_value.ToString());
    NOTREACHED();
  }
}
