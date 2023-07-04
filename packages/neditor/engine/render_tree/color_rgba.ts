import { DCHECK_GE, DCHECK_LE } from '@neditor/core/base/check_op';
import { clamp } from '@neditor/core/base/common/number';

function CheckRange(value: number): void {
  DCHECK_LE(0.0, value);
  DCHECK_GE(1.0, value);
}

// Used to specify a color in the RGB (plus alpha) space.
// This color format is referenced by many render_tree objects in order to
// specify a color.
export class ColorRGBA {
  r_: number;
  g_: number;
  b_: number;
  a_: number;
  // Decodes the color value from 32-bit integer (4 channels, 8 bits each).
  // Note that alpha channel is mandatory, so opaque colors should be encoded
  // as 0xrrggbbff.
  constructor(val: number)
  constructor(red: number, green: number, blue: number, alpha: number)
  constructor(red: number = 0, green: number = 0, blue: number = 0, alpha: number = 0) {
    if (arguments.length === 1) {
      let rgba = red;
      this.a_ = (rgba & 0xff) / 255.0;
      rgba >>= 8;
      this.b_ = (rgba & 0xff) / 255.0;
      rgba >>= 8;
      this.g_ = (rgba & 0xff) / 255.0;
      rgba >>= 8;
      this.r_ = (rgba & 0xff) / 255.0;
    } else {
      CheckRange(red);
      this.r_ = red;
      CheckRange(green);
      this.g_ = green;
      CheckRange(blue);
      this.b_ = blue;
      CheckRange(alpha);
      this.a_ = alpha;
    }
  }

  HasAlpha(): boolean { return (this.a_ < 1.0); }

  set_r(value: number) {
    CheckRange(value);
    this.r_ = value;
  }
  set_g(value: number) {
    CheckRange(value);
    this.g_ = value;
  }
  set_b(value: number) {
    CheckRange(value);
    this.b_ = value;
  }
  set_a(value: number) {
    CheckRange(value);
    this.a_ = value;
  }

  // These functions clamp the color channel values between 0.0f and 1.0f.
  r(): number { return clamp(this.r_, 0.0, 1.0); }
  g(): number { return clamp(this.g_, 0.0, 1.0); }
  b(): number { return clamp(this.b_, 0.0, 1.0); }
  a(): number { return clamp(this.a_, 0.0, 1.0); }

  rgb8_r(): number { return Math.round(this.r() * 255); }

  rgb8_g(): number { return Math.round(this.g() * 255); }

  rgb8_b(): number { return Math.round(this.b() * 255); }

  rgb8_a(): number { return Math.round(this.a() * 255); }

  EQ(rhs: ColorRGBA) {
    let lhs = this;
    return lhs.r() == rhs.r() && lhs.g() == rhs.g() && lhs.b() == rhs.b() &&
      lhs.a() == rhs.a();
  }

  CLONE(): ColorRGBA {
    return new ColorRGBA(this.r(), this.g(), this.b(), this.a());
  }
}

