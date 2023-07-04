import { LayoutUnit } from './layout_unit';
import { Vector2dLayoutUnit } from './vector2d_layout_unit';

export class PointLayoutUnit {
  x_ = new LayoutUnit;
  y_ = new LayoutUnit;

  constructor()
  constructor(p: PointLayoutUnit)
  constructor(x: LayoutUnit, y: LayoutUnit)
  constructor(arg1?: unknown, arg2?: unknown) {
    if (arguments.length == 1) {
      let arg = arg1 as PointLayoutUnit;
      this.x_ = arg.x_.CLONE();
      this.y_ = arg.y_.CLONE();
    } else {
      this.x_ = (arg1 as LayoutUnit).CLONE();
      this.y_ = (arg2 as LayoutUnit).CLONE();
    }
  }

  x() { return this.x_; }
  y() { return this.y_; }

  SetPoint(x: LayoutUnit, y: LayoutUnit) {
    this.x_ = x.CLONE();
    this.y_ = y.CLONE();
  }

  set_x(x: LayoutUnit) { this.x_ = x.CLONE(); }
  set_y(y: LayoutUnit) { this.y_ = y.CLONE(); }

  ADD_ASSIGN(vec: Vector2dLayoutUnit) {
    this.x_.ADD_ASSIGN(vec.x());
    this.y_.ADD_ASSIGN(vec.y());
    return this;
  }

  SUB_ASSIGN(vec: Vector2dLayoutUnit) {
    this.x_.SUB_ASSIGN(vec.x());
    this.y_.SUB_ASSIGN(vec.y());
    return this;
  }

  CLONE(): PointLayoutUnit {
    return new PointLayoutUnit(this.x_, this.y_);
  }

  EQ(rhs: PointLayoutUnit): boolean {
    return this.x() == rhs.x() && this.y() == rhs.y();
  }

  // A point is less than another point if its y-value is closer
  // to the origin. If the y-values are the same, then point with
  // the x-value closer to the origin is considered less than the
  // other.
  // This comparison is required to use Point in sets, or sorted
  // vectors.
  LT(rhs: PointLayoutUnit): boolean {
    return (this.y_ == rhs.y_) ? (this.x_ < rhs.x_) : (this.y_ < rhs.y_);
  }

  toString() {
    return JSON.stringify({
      x: this.x_.toString(),
      y: this.y_.toString(),
    })
  }
}
