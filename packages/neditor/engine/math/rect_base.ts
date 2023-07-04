import { SizeBase } from './size';
import { PointBase } from './point_base';
import { Vector2dF } from './vector2d_f';

export class RectBase {
  size_: SizeBase;
  origin_: PointBase;

  constructor()
  constructor(origin: PointBase)
  constructor(size: SizeBase)
  constructor(size: RectBase)
  constructor(origin: PointBase, size: SizeBase)
  constructor(x: number, y: number, width: number, height: number)
  constructor(arg1?: unknown, arg2?: unknown, arg3?: number, arg4?: number) {
    if (arguments.length === 0) {
      this.size_ = new SizeBase();
      this.origin_ = new PointBase();
    } else if (arguments.length === 1) {
      if (arg1 instanceof PointBase) {
        this.origin_ = (arg1 as PointBase).CLONE();
        this.size_ = new SizeBase();
      } else if (arg1 instanceof RectBase) {
        let r = (arg1 as RectBase).CLONE();
        this.origin_ = new PointBase(r.origin_);
        this.size_ = new SizeBase(r.size_);
      } else {
        this.origin_ = new PointBase();
        this.size_ = (arg1 as SizeBase).CLONE();
      }
    } else if (arguments.length == 2) {
      this.origin_ = (arg1 as PointBase).CLONE();
      this.size_ = (arg2 as SizeBase).CLONE();
    } else {
      this.origin_ = new PointBase(arg1 as number, arg2 as number);
      this.size_ = new SizeBase(arg3 as number, arg4 as number);
    }
  }

  x(): number {
    return this.origin_.x();
  }
  set_x(x: number) {
    this.origin_.set_x(x);
  }

  y(): number {
    return this.origin_.y();
  }
  set_y(y: number) {
    this.origin_.set_y(y);
  }

  width(): number {
    return this.size_.width();
  }
  set_width(width: number) {
    this.size_.set_width(width);
  }

  height(): number {
    return this.size_.height();
  }
  set_height(height: number) {
    this.size_.set_height(height);
  }

  origin() {
    return this.origin_;
  }
  set_origin(origin: PointBase) {
    this.origin_ = origin;
  }

  size(): SizeBase {
    return this.size_;
  }
  set_size(size: SizeBase) {
    this.size_ = size;
  }

  right() {
    return this.x() + this.width();
  }
  bottom() {
    return this.y() + this.height();
  }

  // Returns true if the area of the rectangle is zero.
  IsEmpty(): boolean {
    return this.size_.IsEmpty();
  }

  // Computes the union of this rectangle with the given rectangle.  The union
  // is the smallest rectangle containing both rectangles.
  Union(rect: RectBase) {
    if (this.IsEmpty()) {
      this.size_ = rect.size_.CLONE();
      this.origin_ = rect.origin_.CLONE();
      return;
    }
    if (rect.IsEmpty()) return;

    let rx = Math.min(this.x(), rect.x());
    let ry = Math.min(this.y(), rect.y());
    let rr = Math.max(this.right(), rect.right());
    let rb = Math.max(this.bottom(), rect.bottom());

    this.SetRect(rx, ry, rr - rx, rb - ry);
  }

  SetRect(x: number, y: number, width: number, height: number) {
    this.origin_.SetPoint(x, y);
    this.set_width(width);
    this.set_height(height);
  }

  Offset(vec: Vector2dF) {
    this.origin_.ADD(vec);
  }

  // Shrink the rectangle by the specified amount on each side.
  Inset(left: number, top: number, right: number, bottom: number): void
  // Shrink the rectangle by a horizontal and vertical distance on all sides.
  Inset(horizontal: number, vertical: number): void
  Inset(arg1: number, arg2: number, arg3?: number, arg4?: number): void {
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
    this.origin_.ADD(new Vector2dF(left, top));
    this.set_width(Math.max(this.width() - left - right, 0));
    this.set_height(Math.max(this.height() - top - bottom, 0));
  }

  // Enlarge the rectangle by a horizontal and vertical distance on all sides.
  Outset(horizontal: number, vertical: number) {
    this.Inset(-horizontal, -vertical);
  }

  CLONE(): RectBase {
    return new RectBase(this.origin_.CLONE(), this.size_.CLONE())
  }
  Scale(scale: number) {
    this.origin().Scale(scale)
    this.size().Scale(scale)
  }
}
