import { Vector2dF } from './vector2d_f';

export class PointBase {
  x_: number = 0;
  y_: number = 0;

  constructor()
  constructor(p: PointBase)
  constructor(x: number, y: number)
  constructor(arg1?: unknown, arg2?: unknown) {
    if (arguments.length == 1) {
      let arg = arg1 as PointBase;
      this.x_ = arg.x_;
      this.y_ = arg.y_;
    } else {
      this.x_ = arg1 as number || 0;
      this.y_ = arg2 as number || 0;
    }
  }

  x() { return this.x_; }
  y() { return this.y_; }

  SetPoint(x: number, y: number) {
    this.x_ = x;
    this.y_ = y;
  }

  set_x(x: number) { this.x_ = x; }
  set_y(y: number) { this.y_ = y; }

  SetToMin(other: PointBase) {
    this.x_ = this.x_ <= other.x_ ? this.x_ : other.x_;
    this.y_ = this.y_ <= other.y_ ? this.y_ : other.y_;
  }

  SetToMax(other: PointBase) {
    this.x_ = this.x_ >= other.x_ ? this.x_ : other.x_;
    this.y_ = this.y_ >= other.y_ ? this.y_ : other.y_;
  }

  ADD(vec: Vector2dF) {
    this.x_ += vec.x();
    this.y_ += vec.y();
  }

  EQ(rhs: PointBase) {
    return this.x_ === rhs.x_ && this.y_ === rhs.y_;
  }

  CLONE() {
    return new PointBase(this.x_, this.y_);
  }

  Scale(scale: number) {
    this.x_ *= scale;
    this.y_ *= scale;
  }
}
