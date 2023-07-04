// Represents color values that are convertible to RGBA without knowledge
// of element's context, for example:
//   - #0047ab
//   - rgb(0, 71, 171)
//   - rgba(100%, 0, 0, 10%)
//   - hsl(120, 75%, 75%)
//   - fuchsia
//
// The data is maintained as a 32 bit integer layed out as RRGGBBAA, with
// the red bytes being the most significant.
//
// Applies to properties such as background-color, color, etc.
//
// See https://www.w3.org/TR/css3-color/#rgb-color for details.
import { PropertyValue } from './property_value';
import { castInt } from '@neditor/core/base/common/number';
import type { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId } from '../base/type_id';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';

// Basic color keywords:
//  https://www.w3.org/TR/css3-color/#html4
// Transparent keyword:
//  https://www.w3.org/TR/css3-color/#transparent-def
const kAqua = 0x00FFFFFF;
const kBlack = 0x000000FF;
const kBlue = 0x0000FFFF;
const kFuchsia = 0xFF00FFFF;
const kGray = 0x808080FF;
const kGreen = 0x008000FF;
const kLime = 0x00FF00FF;
const kMaroon = 0x800000FF;
const kNavy = 0x000080FF;
const kOlive = 0x808000FF;
const kPurple = 0x800080FF;
const kRed = 0xFF0000FF;
const kSilver = 0xC0C0C0FF;
const kTeal = 0x008080FF;
const kTransparent = 0x00000000;
const kWhite = 0xFFFFFFFF;
const kYellow = 0xFFFF00FF;

let non_trivial_static_fields: NonTrivialStaticFields;

export class RGBAColorValue extends PropertyValue {
  static fromString(str: string) {
    const ret = Reflect.get(non_trivial_static_fields, str);
    if (!ret) {
      debugger
      NOTIMPLEMENTED();
    }
    return ret;
  }

  value_: number;
  constructor(value: number)
  constructor(r: number, g: number, b: number, a: number)
  constructor(r: number, g?: number, b?: number, a?: number) {
    super();
    if (arguments.length == 1) {
      this.value_ = castInt(r);
    } else {
      this.value_ = castInt(r << 24) | castInt(g! << 16) | castInt(b! << 8) | castInt(a! << 0);
    }
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitRGBAColor(this);
  }
  value(): number { return this.value_; }

  r(): number { return castInt((this.value_ >> 24) & 0xFF); }
  g(): number { return castInt((this.value_ >> 16) & 0xFF); }
  b(): number { return castInt((this.value_ >> 8) & 0xFF); }
  a(): number { return castInt((this.value_ >> 0) & 0xFF); }

  ToString(): string {
    return `rgba(${this.r()}, ${this.g()}, ${this.b()}, ${this.a() / 255})`;
  }

  EQ(other: RGBAColorValue): boolean {
    return this.value_ == other.value_;
  }
  GetTypeId(): number {
    return baseGetTypeId(RGBAColorValue);
  }
}

class NonTrivialStaticFields {
  aqua = new RGBAColorValue(kAqua);
  black = new RGBAColorValue(kBlack);
  blue = new RGBAColorValue(kBlue);
  fuchsia = new RGBAColorValue(kFuchsia);
  gray = new RGBAColorValue(kGray);
  green = new RGBAColorValue(kGreen);
  lime = new RGBAColorValue(kLime);
  maroon = new RGBAColorValue(kMaroon);
  navy = new RGBAColorValue(kNavy);
  olive = new RGBAColorValue(kOlive);
  purple = new RGBAColorValue(kPurple);
  red = new RGBAColorValue(kRed);
  silver = new RGBAColorValue(kSilver);
  teal = new RGBAColorValue(kTeal);
  transparent = new RGBAColorValue(kTransparent);
  white = new RGBAColorValue(kWhite);
  yellow = new RGBAColorValue(kYellow);
}

non_trivial_static_fields = new NonTrivialStaticFields();
