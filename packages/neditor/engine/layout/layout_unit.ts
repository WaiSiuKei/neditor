// This is used to represent distances and positions during layout.
import { castInt } from '@neditor/core/base/common/number';
import { isNumber } from '@neditor/core/base/common/type';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';

export class LayoutUnit {
  private value_: number = 0;
  // The ratio of the LayoutUnit fixed point value to integers.
  static kFixedPointRatio = 64;
  static zero = new LayoutUnit(0);

  static Max(a0: LayoutUnit, ...args: LayoutUnit[]) {
    let max = a0;
    for (let arg of args) {
      if (arg.GT(max)) {
        max = arg;
      }
    }
    return max;
  }

  static MaxValue() {
    return new LayoutUnit(Number.POSITIVE_INFINITY);
  }

  static Min(a0: LayoutUnit, ...args: LayoutUnit[]) {
    let min = a0;
    for (let arg of args) {
      if (arg.LT(min)) {
        min = arg;
      }
    }
    return min;
  }

  constructor()
  constructor(value: LayoutUnit)
  constructor(value: number)
  constructor(value ?: number | LayoutUnit) {
    if (!arguments.length) return;
    let v: number;
    if (value instanceof LayoutUnit) {
      this.value_ = value.value_;
    } else if (isNumber(value)) {
      v = value;
      this.value_ = v * LayoutUnit.kFixedPointRatio;
    } else {
      NOTIMPLEMENTED();
    }
  }

  toFloat(): number {
    return this.value_ / LayoutUnit.kFixedPointRatio;
  }

  // swap(value: LayoutUnit) {
  //   let tmp = value.value_;
  //   value.value_ = this.value_;
  //   this.value_ = tmp;
  // }

  LT(other: LayoutUnit): boolean { return this.value_ < other.value_; }
  LE(other: LayoutUnit): boolean { return this.value_ <= other.value_; }
  GT(other: LayoutUnit): boolean { return this.value_ > other.value_; }
  GE(other: LayoutUnit): boolean { return this.value_ >= other.value_; }
  EQ(other: LayoutUnit): boolean { return this.value_ == other.value_; }
  NE(other: LayoutUnit): boolean { return this.value_ !== other.value_; }

  EqualOrNaN(other: LayoutUnit): boolean {
    return Number.isNaN(this.value_) || Number.isNaN(other.value_) || this.EQ(other);
  }
  POS(): LayoutUnit { return new LayoutUnit(this.value_); }
  NEG(): LayoutUnit {return new LayoutUnit(-this.value_);}

  ADD_ASSIGN(other: LayoutUnit): LayoutUnit {
    this.value_ += other.value_;
    return this;
  }
  ADD(other: LayoutUnit) {
    let res = this.CLONE();
    return res.ADD_ASSIGN(other);
  }
  SUB_ASSIGN(other: LayoutUnit) {
    this.value_ -= other.value_;
    return this;
  }
  SUB(other: LayoutUnit) {
    let res = this.CLONE();
    return res.SUB_ASSIGN(other);
  }
  CLONE() {
    let res = new LayoutUnit();
    res.value_ = this.value_;
    return res;
  }

  // Scaling math operators.

  MUL_ASSIGN(b: number) {
    this.value_ = castInt(this.value_ * b);
    return this;
  }
  DIV_ASSIGN(b: number) {
    this.value_ = castInt(this.value_ / b);
    return this;
  }
  MUL(b: number) {
    let res = this.CLONE();
    return res.MUL_ASSIGN(b);
  }
  DIV(b: number) {
    let res = this.CLONE();
    return res.DIV_ASSIGN(b);
  }
  toString() {
    return this.toFloat().toString();
  }
}
