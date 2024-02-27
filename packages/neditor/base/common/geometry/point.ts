import { Vector2d } from './vector2d';

export class Point {
  x_: number = 0;
  y_: number = 0;

  constructor()
  constructor(p: Point)
  constructor(x: number,
              y: number)
  constructor(arg1?: unknown,
              arg2?: unknown) {
    if (arguments.length == 1) {
      let arg = arg1 as Point;
      this.x_ = arg.x_;
      this.y_ = arg.y_;
    } else {
      this.x_ = arg1 as number || 0;
      this.y_ = arg2 as number || 0;
    }
  }

  get x() { return this.x_; }
  get y() { return this.y_; }

  setPoint(x: number,
           y: number) {
    this.x_ = x;
    this.y_ = y;
  }

  set x(x: number) { this.x_ = x; }
  set y(y: number) { this.y_ = y; }

  // setToMin(other: Point) {
  //   this.x_ = this.x_ <= other.x_ ? this.x_ : other.x_;
  //   this.y_ = this.y_ <= other.y_ ? this.y_ : other.y_;
  // }
  //
  // setToMax(other: Point) {
  //   this.x_ = this.x_ >= other.x_ ? this.x_ : other.x_;
  //   this.y_ = this.y_ >= other.y_ ? this.y_ : other.y_;
  // }

  ADD(vec: Vector2d) {
    this.x_ += vec.x;
    this.y_ += vec.y;
  }

  EQ(rhs: Point) {
    return this.x_ === rhs.x_ && this.y_ === rhs.y_;
  }

  CLONE() {
    return new Point(this.x_, this.y_);
  }

  scale(scale: number) {
    this.x_ *= scale;
    this.y_ *= scale;
  }
}

export function PointAtOffsetFromOrigin(offset_from_origin: Vector2d) {
  return new Point(offset_from_origin.x, offset_from_origin.y);
}
