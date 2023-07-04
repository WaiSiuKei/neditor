import { LayoutUnit } from './layout_unit';
import { Vector2dF } from '../math/vector2d_f';

export class Vector2dLayoutUnit {
  x_: LayoutUnit
  y_: LayoutUnit

  constructor()
  constructor(other: Vector2dLayoutUnit)
  constructor(x: LayoutUnit, y: LayoutUnit)
  constructor(a1?: LayoutUnit | Vector2dLayoutUnit, a2?: LayoutUnit) {
    if (!arguments.length) {
      this.x_ = new LayoutUnit()
      this.y_ = new LayoutUnit()
    } else if (arguments.length === 1 && a1 instanceof Vector2dLayoutUnit) {
      this.x_ = a1.x_;
      this.y_ = a1.y_;
    } else {
      this.x_ = a1 as LayoutUnit;
      this.y_ = a2 as LayoutUnit;
    }
  }

  SetVector(x: LayoutUnit, y: LayoutUnit) {
    this.x_ = x;
    this.y_ = y;
  }

  x() {
    return this.x_;
  }
  set_x(x: LayoutUnit) {
    this.x_ = x;
  }

  y() {
    return this.y_;
  }
  set_y(y: LayoutUnit) {
    this.y_ = y;
  }

  // True if both components of the vector are 0.
  IsZero() {
    return this.x_.EQ(new LayoutUnit()) && this.y_.EQ(new LayoutUnit());
  }

  // Add the components of the |other| vector to the current vector.
  ADD(other: Vector2dLayoutUnit) {
    this.x_.ADD_ASSIGN(other.x_);
    this.y_.ADD_ASSIGN(other.y_);
    return this;
  }

  // Subtract the components of the |other| vector from the current vector.
  SUB(other: Vector2dLayoutUnit) {
    this.x_.SUB_ASSIGN(other.x_);
    this.y_.SUB_ASSIGN(other.y_);
    return this;
  }
  // Add the components of the |other| vector to the current vector.
  ADD_ASSIGN(other: Vector2dLayoutUnit) {
    return this.ADD(other);
  }
  SUB_ASSIGN(other: Vector2dLayoutUnit) {
    return this.SUB(other);
  }

  get ['0']() {
    return this.x_;
  }
  get ['1']() {
    return this.y_;
  }

  SetToMin(other: Vector2dLayoutUnit) {
    this.x_ = this.x_.LE(other.x_) ? this.x_ : other.x_;
    this.y_ = this.y_.LE(other.y_) ? this.y_ : other.y_;
  }

  SetToMax(other: Vector2dLayoutUnit) {
    this.x_ = this.x_.GE(other.x_) ? this.x_ : other.x_;
    this.y_ = this.y_.GE(other.y_) ? this.y_ : other.y_;
  }

  toString() {
    return `[${this.x_} ${this.y_}]`;
  }

  toVector2dF() {
    return new Vector2dF(this.x_.toFloat(), this.y_.toFloat());
  }

  EQ(rhs: Vector2dLayoutUnit) {
    return this.x() == rhs.x() && this.y() == rhs.y();
  }

  NE(rhs: Vector2dLayoutUnit) {
    return !this.EQ(rhs);
  }

  NEG() {
    return new Vector2dLayoutUnit(new LayoutUnit(-this.x()), new LayoutUnit(-this.y()));
  }
}
