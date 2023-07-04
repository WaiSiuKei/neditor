// Specifies the weight of glyphs in the font, their degree of blackness
// or stroke thickness.
//   https://www.w3.org/TR/css3-fonts/#font-weight-prop
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { kBoldKeywordName, kNormalKeywordName } from './keyword_names';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { baseGetTypeId } from '../base/type_id';

export enum FontWeightEnum {
  kThinAka100,
  kExtraLightAka200,  // same as Ultra Light
  kLightAka300,
  kNormalAka400,
  kMediumAka500,
  kSemiBoldAka600,    // same as Demi Bold
  kBoldAka700,
  kExtraBoldAka800,   // same as Ultra Bold
  kBlackAka900,       // same as Heavy
}

export class FontWeightValue extends PropertyValue {
  private value_: FontWeightEnum;

  constructor(value: FontWeightEnum) {
    super();
    this.value_ = value;
  }

  // For the sake of saving memory an explicit instantiation of this class
  // is disallowed. Use factory methods below to obtain shared instances.
  static GetThinAka100() {return non_trivial_static_fields.thin_aka_100;}
  static GetExtraLightAka200() {return non_trivial_static_fields.extra_light_aka_200;}
  static GetLightAka300() {return non_trivial_static_fields.light_aka_300;}
  static GetNormalAka400() {return non_trivial_static_fields.normal_aka_400;}
  static GetMediumAka500() {return non_trivial_static_fields.medium_aka_500;}
  static GetSemiBoldAka600() {return non_trivial_static_fields.semi_bold_aka_600;}
  static GetBoldAka700() {return non_trivial_static_fields.bold_aka_700;}
  static GetExtraBoldAka800() {return non_trivial_static_fields.extra_bold_aka_800;}
  static GetBlackAka900() {return non_trivial_static_fields.black_aka_900;}

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitFontWeight(this);
  }

  value() { return this.value_; }

  ToString(): string {
    switch (this.value_) {
      case FontWeightEnum.kNormalAka400:
        return kNormalKeywordName;
      case FontWeightEnum.kBoldAka700:
        return kBoldKeywordName;
      case FontWeightEnum.kThinAka100:
      case FontWeightEnum.kExtraLightAka200:
      case FontWeightEnum.kLightAka300:
      case FontWeightEnum.kMediumAka500:
      case FontWeightEnum.kSemiBoldAka600:
      case FontWeightEnum.kExtraBoldAka800:
      case FontWeightEnum.kBlackAka900:
      default:
        // These values are not implemented by the scanner/parser.
        NOTIMPLEMENTED();
    }
  }

  EQ(other: FontWeightValue) {
    return this.value_ === other.value_;
  }
  GetTypeId(): number {
    return baseGetTypeId(FontWeightValue)
  }
}

class NonTrivialStaticFields {
  thin_aka_100: FontWeightValue;
  extra_light_aka_200: FontWeightValue;
  light_aka_300: FontWeightValue;
  normal_aka_400: FontWeightValue;
  medium_aka_500: FontWeightValue;
  semi_bold_aka_600: FontWeightValue;
  bold_aka_700: FontWeightValue;
  extra_bold_aka_800: FontWeightValue;
  black_aka_900: FontWeightValue;

  constructor() {
    this.thin_aka_100 = new FontWeightValue(FontWeightEnum.kThinAka100);
    this.extra_light_aka_200 =
      new FontWeightValue(FontWeightEnum.kExtraLightAka200);
    this.light_aka_300 = new FontWeightValue(FontWeightEnum.kLightAka300);
    this.normal_aka_400 = new FontWeightValue(FontWeightEnum.kNormalAka400);
    this.medium_aka_500 = new FontWeightValue(FontWeightEnum.kMediumAka500);
    this.semi_bold_aka_600 =
      new FontWeightValue(FontWeightEnum.kSemiBoldAka600);
    this.bold_aka_700 = new FontWeightValue(FontWeightEnum.kBoldAka700);
    this.extra_bold_aka_800 =
      new FontWeightValue(FontWeightEnum.kExtraBoldAka800);
    this.black_aka_900 = new FontWeightValue(FontWeightEnum.kBlackAka900);
  }
}

let non_trivial_static_fields = new NonTrivialStaticFields();
