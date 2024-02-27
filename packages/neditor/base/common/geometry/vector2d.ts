import { isNil } from '../type';

export class Vector2d {
  x_: number;
  y_: number;
  constructor(x: number = 0,
              y: number = 0) {
    this.x_ = x;
    this.y_ = y;
  }

  SetVector(x: number,
            y: number) {
    this.x_ = x;
    this.y_ = y;
  }

  get x() { return this.x_; }
  set x(x: number) { this.x_ = x; }

  get y(): number { return this.y_; }
  set y(y: number) {this.y_ = y; }

  // True if both components of the vector are 0.
  IsZero() {
    return this.x_ == 0 && this.y_ == 0;
  }

  // Add the components of the |other| vector to the current vector.
  add(other: Vector2d): Vector2d {
    this.x_ += other.x_;
    this.y_ += other.y_;
    return this;
  }
  // Subtract the components of the |other| vector from the current vector.
  subtract(other: Vector2d) {
    this.x_ -= other.x_;
    this.y_ -= other.y_;
  }

  get ['0'](): number {
    return this.x_;
  }

  get ['1'](): number {
    return this.y_;
  }

  SetToMin(other: Vector2d) {
    this.x_ = this.x_ <= other.x_ ? this.x_ : other.x_;
    this.y_ = this.y_ <= other.y_ ? this.y_ : other.y_;
  }

  SetToMax(other: Vector2d) {
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
  Scale(x_scale: number,
        y_scale: number): void
  Scale(x_scale: number,
        y_scale?: unknown) {
    if (isNil(y_scale)) {
      return this.Scale(x_scale, x_scale);
    }
    this.x_ *= x_scale;
    this.y_ *= y_scale as number;
  }
  SUB_ASSIGN(other: Vector2d) {
    this.subtract(other);
  }
  ADD_ASSIGN(other: Vector2d) {
    this.add(other);
  }

  CLONE() {
    return new Vector2d(this.x, this.y);
  }

  toString() {
    return `[${this.x_}, ${this.y_}]`;
  }
}
