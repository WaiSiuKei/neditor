import { isNil } from '@neditor/core/base/common/type';

export class Vector2dF {
  x_: number;
  y_: number;
  constructor(x: number = 0, y: number = 0) {
    this.x_ = x;
    this.y_ = y;
  }

  SetVector(x: number, y: number) {
    this.x_ = x;
    this.y_ = y;
  }

  x() { return this.x_; }
  set_x(x: number) { this.x_ = x; }

  y(): number { return this.y_; }
  set_y(y: number) {this.y_ = y; }

  // True if both components of the vector are 0.
  IsZero() {
    return this.x_ == 0 && this.y_ == 0;
  }

  // Add the components of the |other| vector to the current vector.
  Add(other: Vector2dF): Vector2dF {
    this.x_ += other.x_;
    this.y_ += other.y_;
    return this;
  }
  // Subtract the components of the |other| vector from the current vector.
  Subtract(other: Vector2dF) {
    this.x_ -= other.x_;
    this.y_ -= other.y_;
  }

  get ['0'](): number {
    return this.x_;
  }

  get ['1'](): number {
    return this.y_;
  }

  SetToMin(other: Vector2dF) {
    this.x_ = this.x_ <= other.x_ ? this.x_ : other.x_;
    this.y_ = this.y_ <= other.y_ ? this.y_ : other.y_;
  }

  SetToMax(other: Vector2dF) {
    this.x_ = this.x_ >= other.x_ ? this.x_ : other.x_;
    this.y_ = this.y_ >= other.y_ ? this.y_ : other.y_;
  }

  // Gives the square of the diagonal length of the vector.
  LengthSquared() {
    return this.x_ * this.x_ + this.y_ * this.y_;
  }
  // Gives the diagonal length of the vector.
  Length() {
    return Math.sqrt(this.LengthSquared());
  }

  // Scale the x and y components of the vector by |scale|.
  Scale(scale: number): void
  // Scale the x and y components of the vector by |x_scale| and |y_scale|
  // respectively.
  Scale(x_scale: number, y_scale: number): void
  Scale(x_scale: number, y_scale?: unknown) {
    if (isNil(y_scale)) {
      return this.Scale(x_scale, x_scale);
    }
    this.x_ *= x_scale;
    this.y_ *= y_scale as number;
  }
  SUB_ASSIGN(other: Vector2dF) {
    this.Subtract(other);
  }
  ADD_ASSIGN(other: Vector2dF) {
    this.Add(other);
  }

  CLONE() {
    return new Vector2dF(this.x(), this.y())
  }
}
