// A floating-point version of Size.
import { LayoutUnit } from './layout_unit';
import { SizeF } from '../math/size_f';
import { SizeBase } from '../math/size';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';

export class SizeLayoutUnit {
  width_ = new LayoutUnit();
  height_ = new LayoutUnit();

  constructor()
  constructor(p: SizeLayoutUnit)
  constructor(p: SizeBase)
  constructor(x: LayoutUnit, y: LayoutUnit)
  constructor(arg1?: unknown, arg2?: unknown) {
    if (arguments.length == 1) {
      if (arg1 instanceof SizeLayoutUnit) {
        let arg = arg1 as SizeLayoutUnit;
        this.width_ = arg.width_.CLONE();
        this.height_ = arg.height_.CLONE();
      } else if (arg1 instanceof SizeBase) {
        this.width_ = new LayoutUnit(arg1.width());
        this.height_ = new LayoutUnit(arg1.height());
      } else {
        NOTIMPLEMENTED();
      }
    } else if (arguments.length == 2) {
      this.width_ = (arg1 as LayoutUnit).CLONE();
      this.height_ = (arg2 as LayoutUnit).CLONE();
    }
  }

  IsEmpty(): boolean {
    throw new Error('');
    // return (this.width_ == 0) || (this.height_ == (0));
  }
  width() { return this.width_; }
  height() { return this.height_; }

  set_width(width: LayoutUnit) { this.width_ = width.CLONE(); }
  set_height(height: LayoutUnit) { this.height_ = height.CLONE(); }

  SetSize(width: LayoutUnit, height: LayoutUnit) {
    this.set_width(width);
    this.set_height(height);
  }

  Enlarge(width: LayoutUnit, height: LayoutUnit) {
    this.set_width(this.width_.ADD(width) as LayoutUnit);
    this.set_height(this.height_.ADD(height) as LayoutUnit);
  }
  SetToMin(other: SizeLayoutUnit) {
    this.width_ = this.width_.LE(other.width_) ? this.width_ : other.width_;
    this.height_ = this.height_.LE(other.height_) ? this.height_ : other.height_;
  }

  SetToMax(other: SizeLayoutUnit) {
    this.width_ = this.width_.GE(other.width_) ? this.width_ : other.width_.CLONE();
    this.height_ = this.height_.GE(other.height_) ? this.height_ : other.height_.CLONE();
  }

  toSizeF() {
    return new SizeF(this.width().toFloat(), this.height().toFloat());
  }

  Scale(x_scale: number, y_scale: number = x_scale) {
    this.SetSize(this.width().MUL(x_scale), this.height().MUL(y_scale));
  }

  EQ(rhs: SizeLayoutUnit) {
    return this.width_.EQ(rhs.width_) && this.height_.EQ(rhs.height_);
  }
  NE(rhs: SizeLayoutUnit) {
    return !this.EQ(rhs);
  }
  toString() {
    return JSON.stringify({
      width: this.width_.toFloat(),
      height: this.height_.toFloat(),
    });
  }
  CLONE() {
    return new SizeLayoutUnit(this.width_, this.height_);
  }
}

