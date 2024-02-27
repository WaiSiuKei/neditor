import { Size } from './size';
import { Point } from './point';
import { Vector2d } from './vector2d';

export class Rect {
  size_: Size;
  origin_: Point;

  constructor()
  constructor(origin: Point)
  constructor(size: Size)
  constructor(size: Rect)
  constructor(origin: Point,
              size: Size)
  constructor(x: number,
              y: number,
              width: number,
              height: number)
  constructor(arg1?: unknown,
              arg2?: unknown,
              arg3?: number,
              arg4?: number) {
    if (arguments.length === 0) {
      this.size_ = new Size();
      this.origin_ = new Point();
    } else if (arguments.length === 1) {
      if (arg1 instanceof Point) {
        this.origin_ = (arg1 as Point).CLONE();
        this.size_ = new Size();
      } else if (arg1 instanceof Rect) {
        let r = (arg1 as Rect).CLONE();
        this.origin_ = new Point(r.origin_);
        this.size_ = new Size(r.size_);
      } else {
        this.origin_ = new Point();
        this.size_ = (arg1 as Size).CLONE();
      }
    } else if (arguments.length == 2) {
      this.origin_ = (arg1 as Point).CLONE();
      this.size_ = (arg2 as Size).CLONE();
    } else {
      this.origin_ = new Point(arg1 as number, arg2 as number);
      this.size_ = new Size(arg3 as number, arg4 as number);
    }
  }

  get x(): number {
    return this.origin_.x;
  }
  set x(x: number) {
    this.origin_.x = x;
  }

  get y(): number {
    return this.origin_.y;
  }
  set y(y: number) {
    this.origin_.y = (y);
  }

  get width(): number {
    return this.size_.width;
  }
  set width(width: number) {
    this.size_.width = (width);
  }

  get height(): number {
    return this.size_.height;
  }
  set height(height: number) {
    this.size_.height = (height);
  }

  get origin() {
    return this.origin_;
  }
  set origin(origin: Point) {
    this.origin_ = origin;
  }

  get size(): Size {
    return this.size_;
  }
  set size(size: Size) {
    this.size_ = size;
  }

  get right() {
    return this.x + this.width;
  }
  get bottom() {
    return this.y + this.height;
  }

  // Returns true if the area of the rectangle is zero.
  IsEmpty(): boolean {
    return this.size_.isEmpty();
  }

  // Computes the union of this rectangle with the given rectangle.  The union
  // is the smallest rectangle containing both rectangles.
  union(rect: Rect) {
    if (this.IsEmpty()) {
      this.size_ = rect.size_.CLONE();
      this.origin_ = rect.origin_.CLONE();
      return;
    }
    if (rect.IsEmpty()) return;

    let rx = Math.min(this.x, rect.x);
    let ry = Math.min(this.y, rect.y);
    let rr = Math.max(this.right, rect.right);
    let rb = Math.max(this.bottom, rect.bottom);

    this.SetRect(rx, ry, rr - rx, rb - ry);
  }

  SetRect(x: number,
          y: number,
          width: number,
          height: number) {
    this.origin_.setPoint(x, y);
    this.width = width;
    this.height = (height);
  }

  offset(vec: Vector2d) {
    this.origin_.ADD(vec);
  }

  // Shrink the rectangle by the specified amount on each side.
  Inset(left: number,
        top: number,
        right: number,
        bottom: number): void
  // Shrink the rectangle by a horizontal and vertical distance on all sides.
  Inset(horizontal: number,
        vertical: number): void
  Inset(arg1: number,
        arg2: number,
        arg3?: number,
        arg4?: number): void {
    // Inset(horizontal, vertical, horizontal, vertical);
    let left: number;
    let right: number;
    let top: number;
    let bottom: number;
    if (arguments.length === 4) {
      left = arg1 as number;
      top = arg2 as number;
      right = arg3 as number;
      bottom = arg4 as number;
    } else {
      left = right = arg1 as number;
      top = bottom = arg2 as number;
    }
    this.origin_.ADD(new Vector2d(left, top));
    this.width = (Math.max(this.width - left - right, 0));
    this.height = (Math.max(this.height - top - bottom, 0));
  }

  // Enlarge the rectangle by a horizontal and vertical distance on all sides.
  Outset(horizontal: number,
         vertical: number) {
    this.Inset(-horizontal, -vertical);
  }

  CLONE(): Rect {
    return new Rect(this.origin_.CLONE(), this.size_.CLONE());
  }
  scale(scale: number) {
    this.origin.scale(scale);
    this.size.scale(scale);
  }
}
