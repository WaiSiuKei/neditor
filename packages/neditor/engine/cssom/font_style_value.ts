import { PropertyValue } from './property_value';
import type { PropertyValueVisitor } from './property_value_visitor';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { kItalicKeywordName, kNormalKeywordName, kObliqueKeywordName } from './keyword_names';
import { baseGetTypeId } from '../base/type_id';

export enum FontStyleEnum {
  kItalic,
  kNormal,
  kOblique,
}


export class FontStyleValue extends PropertyValue {

  // For the sake of saving memory an explicit instantiation of this class
  // is disallowed. Use getter methods below to obtain shared instances.
  static GetItalic() {return non_trivial_static_fields.italic;}
  static GetNormal() {return non_trivial_static_fields.normal;}
  static GetOblique() {return non_trivial_static_fields.oblique;}

  value_: FontStyleEnum = FontStyleEnum.kNormal;

  constructor(value: FontStyleEnum) {
    super();
    this.value_ = value;
  }

  Accept(visitor: PropertyValueVisitor): void {visitor.VisitFontStyle(this);}
  value(): FontStyleEnum { return this.value_; }
  ToString(): string {
    switch (this.value_) {
      case FontStyleEnum.kItalic:
        return kItalicKeywordName;
      case FontStyleEnum.kNormal:
        return kNormalKeywordName;
      case FontStyleEnum.kOblique:
        return kObliqueKeywordName;
      default:
        NOTREACHED();
        return '';
    }
  }
  GetTypeId(): number {
    return baseGetTypeId(FontStyleValue);
  }
  EQ(other: PropertyValue): boolean {
    if (!(other instanceof FontStyleValue)) return false;
    return this.value_ === other.value_;
  }
}

class NonTrivialStaticFields {
  italic = new FontStyleValue(FontStyleEnum.kItalic);
  normal = new FontStyleValue(FontStyleEnum.kNormal);
  oblique = new FontStyleValue(FontStyleEnum.kOblique);
}

const non_trivial_static_fields = new NonTrivialStaticFields();
