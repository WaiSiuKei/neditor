import { SizeLayoutUnit } from './size_layout_unit';
import { PointLayoutUnit } from './point_layout_unit';
import { LayoutUnit } from './layout_unit';
import { Vector2dLayoutUnit } from './vector2d_layout_unit';
import { InsetsLayoutUnit } from './insets_layout_unit';
import { NOTIMPLEMENTED, NOTREACHED } from "@neditor/core/base/common/notreached";

export class RectLayoutUnit {
  origin_: PointLayoutUnit
  size_: SizeLayoutUnit

  constructor()
  constructor(origin: PointLayoutUnit)
  constructor(size: SizeLayoutUnit)
  constructor(origin: PointLayoutUnit, size: SizeLayoutUnit)
  constructor(width: LayoutUnit, height: LayoutUnit)
  constructor(x: LayoutUnit, y: LayoutUnit, width: LayoutUnit, height: LayoutUnit)
  constructor(a1?: unknown, a2?: unknown, a3?: LayoutUnit, a4?: LayoutUnit) {
    if (arguments.length === 1) {
      if (a1 instanceof PointLayoutUnit) {
        this.origin_ = a1.CLONE();
        this.size_ = new SizeLayoutUnit()
      } else if (a1 instanceof SizeLayoutUnit) {
        this.size_ = a1.CLONE();
        this.origin_ = new PointLayoutUnit();
      } else {
        NOTIMPLEMENTED()
      }
    } else if (arguments.length === 2) {
      if (a1 instanceof PointLayoutUnit) {
        this.origin_ = a1.CLONE();
        this.size_ = (a2 as SizeLayoutUnit).CLONE();
      } else {
        this.size_ = new SizeLayoutUnit(a1 as LayoutUnit, a2 as LayoutUnit);
        this.origin_ = new PointLayoutUnit()
      }
    } else if (arguments.length === 4) {
      this.origin_ = new PointLayoutUnit(a1 as LayoutUnit, a2 as LayoutUnit);
      this.size_ = new SizeLayoutUnit(a3 as LayoutUnit, a4 as LayoutUnit);
    } else {
      NOTREACHED()
    }
  }
  //  constructor(origin: PointLayoutUnit, size: SizeLayoutUnit) {}
  //
  //   RectBase( PointClass& origin,  SizeClass& size)
  // : origin_(origin), size_(size) {}
  //   explicit RectBase( SizeClass& size) : size_(size) {}
  //   explicit RectBase( PointClass& origin) : origin_(origin) {}

  //#region base
  x() {
    return this.origin_.x();
  }
  left() {
    return this.x()
  }
  set_x(x: LayoutUnit) {
    this.origin_.set_x(x);
  }

  y() {
    return this.origin_.y();
  }
  top() {
    return this.y()
  }
  set_y(y: LayoutUnit) {
    this.origin_.set_y(y);
  }

  width() {
    return this.size_.width();
  }
  set_width(width: LayoutUnit) {
    this.size_.set_width(width);
  }

  height() {
    return this.size_.height();
  }
  set_height(height: LayoutUnit) {
    this.size_.set_height(height);
  }

  origin() {
    return this.origin_;
  }
  set_origin(origin: PointLayoutUnit) {
    this.origin_ = origin.CLONE();
  }

  size() {
    return this.size_;
  }
  set_size(size: SizeLayoutUnit) {
    this.size_ = size.CLONE();
  }

  right() {
    return this.x().ADD(this.width());
  }
  bottom() {
    return this.y().ADD(this.height());
  }

  top_right() {
    return new PointLayoutUnit(this.right(), this.y());
  }
  bottom_left() {
    return new PointLayoutUnit(this.x(), this.bottom());
  }
  bottom_right() {
    return new PointLayoutUnit(this.right(), this.bottom());
  }

  OffsetFromOrigin() {
    return new Vector2dLayoutUnit(this.x(), this.y());
  }

  SetRect(x: LayoutUnit, y: LayoutUnit, width: LayoutUnit, height: LayoutUnit) {
    this.origin_.SetPoint(x, y);
    this.set_width(width);
    this.set_height(height);
  }

  // Shrink the rectangle by the given insets.
  Inset(insets: InsetsLayoutUnit): void
  // Shrink the rectangle by a horizontal and vertical distance on all sides.
  Inset(horizontal: LayoutUnit, vertical: LayoutUnit): void
  // Shrink the rectangle by the specified amount on each side.
  Inset(left: LayoutUnit, top: LayoutUnit, right: LayoutUnit, bottom: LayoutUnit): void
  Inset(a1: unknown, a2?: unknown, a3?: unknown, a4?: unknown): void {
    let left: LayoutUnit;
    let top: LayoutUnit;
    let right: LayoutUnit;
    let bottom: LayoutUnit;
    if (arguments.length === 1) {
      let insets = a1 as InsetsLayoutUnit;
      left = insets.left();
      top = insets.top();
      right = insets.right();
      bottom = insets.bottom();
    } else if (arguments.length === 2) {
      let horizontal = a1 as LayoutUnit;
      let vertical = a2 as LayoutUnit;
      left = right = horizontal;
      top = bottom = vertical;
    } else {
      left = a1 as LayoutUnit;
      top = a2 as LayoutUnit;
      right = a3 as LayoutUnit;
      bottom = a4 as LayoutUnit;
    }
    this.origin_.ADD_ASSIGN(new Vector2dLayoutUnit(left, top));
    this.set_width(LayoutUnit.Max(this.width().SUB(left).SUB(right), new LayoutUnit()));
    this.set_height(LayoutUnit.Max(this.height().SUB(top).SUB(bottom), new LayoutUnit()));
  }

  // Enlarge the rectangle by the given insets.
  Outset(insets: InsetsLayoutUnit): void
  // Enlarge the rectangle by a horizontal and vertical distance on all sides.
  Outset(horizontal: LayoutUnit, vertical: LayoutUnit): void
  // Enlarge the rectangle by the specified amount on each side.
  Outset(left: LayoutUnit, top: LayoutUnit, right: LayoutUnit, bottom: LayoutUnit): void
  Outset(a1: unknown, a2?: unknown, a3?: unknown, a4?: unknown): void {
    // Inset(-left, -top, -right, -bottom);
    if (arguments.length === 1) {
      this.Inset((a1 as InsetsLayoutUnit).NEG());
    } else if (arguments.length == 2) {
      this.Inset((a1 as LayoutUnit).NEG(), (a2 as LayoutUnit).NEG());
    } else {
      this.Inset(
        (a1 as LayoutUnit).NEG(),
        (a2 as LayoutUnit).NEG(),
        (a3 as LayoutUnit).NEG(),
        (a4 as LayoutUnit).NEG(),
      );
    }
  }

  // Move the rectangle by a horizontal and vertical distance.
  Offset(distance: Vector2dLayoutUnit): void
  Offset(horizontal: LayoutUnit, vertical: LayoutUnit): void
  Offset(a1: unknown, a2?: unknown): void {
    if (arguments.length == 1) {
      this.origin_.ADD_ASSIGN(a1 as Vector2dLayoutUnit);
    } else {
      this.origin_.ADD_ASSIGN(new Vector2dLayoutUnit(a1 as LayoutUnit, a2 as LayoutUnit));
    }
  }

  ASS_ASSIGN(offset: Vector2dLayoutUnit) {
    return this.origin_.ADD_ASSIGN(offset);
  }

  SUB_ASSIGN(offset: Vector2dLayoutUnit) {
    return this.origin_.SUB_ASSIGN(offset);
  }

  InsetsFrom(inner: RectLayoutUnit) {
    return new InsetsLayoutUnit(
      inner.x().SUB(this.x()),
      inner.y().SUB(this.y()),
      this.right().SUB(inner.right()),
      this.bottom().SUB(inner.bottom()));
  }

// Returns true if the area of the rectangle is zero.
  IsEmpty() {
    return this.size_.IsEmpty();
  }

// A rect is less than another rect if its origin is less than
// the other rect's origin. If the origins are equal, then the
// shortest rect is less than the other. If the origin and the
// height are equal, then the narrowest rect is less than.
// This comparison is required to use Rects in sets, or sorted
// vectors.
  LT(other: RectLayoutUnit): boolean {
    if (this.origin_.EQ(other.origin())) {
      if (this.width().EQ(other.width())) {
        return this.height().LT(other.height());
      } else {
        return this.width().GT(other.width());
      }
    } else {
      return this.origin_.LT(other.origin());
    }
  }

  // Returns true if this rectangle contains the specified rectangle.
  Contains(rect: RectLayoutUnit): boolean
  // Returns true if the specified point is contained by this rectangle.
  Contains(point: PointLayoutUnit): boolean
  // Returns true if the point identified by point_x and point_y falls inside
  // this rectangle.  The point (x, y) is inside the rectangle, but the
  // point (x + width, y + height) is not.
  Contains(point_x: LayoutUnit, point_y: LayoutUnit): boolean
  Contains(a1: unknown, a2?: unknown): boolean {
    if (arguments.length === 1) {
      if (a1 instanceof RectLayoutUnit) {
        return a1.x().GE(this.x())
          && a1.right().LE(this.right())
          && a1.y().GE(this.y())
          && a1.bottom().LE(this.bottom());
      } else {
        let point = a1 as PointLayoutUnit;
        return (point.x() >= this.x()) && (point.x() < this.right()) && (point.y() >= this.y()) &&
          (point.y() < this.bottom());
      }
    } else {
      let point_x = a1 as LayoutUnit;
      let point_y = a2 as LayoutUnit;
      return (point_x >= this.x()) && (point_x < this.right()) && (point_y >= this.y()) &&
        (point_y < this.bottom());
    }
  }

// Returns true if this rectangle intersects the specified rectangle.
// An empty rectangle doesn't intersect any rectangle.
  Intersects(rect: RectLayoutUnit): boolean {
    return !(this.IsEmpty() || rect.IsEmpty() || rect.x().GE(this.right()) ||
      rect.right().LE(this.x()) || rect.y().GE(this.bottom()) || rect.bottom().LE(this.y()));
  }

// Computes the intersection of this rectangle with the given rectangle.
  Intersect(rect: RectLayoutUnit) {
    if (this.IsEmpty() || rect.IsEmpty()) {
      this.SetRect(new LayoutUnit(), new LayoutUnit(), new LayoutUnit(), new LayoutUnit());
      return;
    }

    let rx = LayoutUnit.Max(this.x(), rect.x());
    let ry = LayoutUnit.Max(this.y(), rect.y());
    let rr = LayoutUnit.Min(this.right(), rect.right());
    let rb = LayoutUnit.Min(this.bottom(), rect.bottom());

    if (rx.GE(rr) || ry.GE(rb)) rx = ry = rr = rb = new LayoutUnit();  // non-intersecting

    this.SetRect(rx, ry, rr.SUB(rx), rb.SUB(ry));
  }

// Computes the union of this rectangle with the given rectangle.  The union
// is the smallest rectangle containing both rectangles.
  Union(rect: RectLayoutUnit) {
    if (rect.IsEmpty()) return;

    let rx = LayoutUnit.Min(this.x(), rect.x());
    let ry = LayoutUnit.Min(this.y(), rect.y());
    let rr = LayoutUnit.Max(this.right(), rect.right());
    let rb = LayoutUnit.Max(this.bottom(), rect.bottom());

    this.SetRect(rx, ry, rr.SUB(rx), rb.SUB(ry));
  }

// Computes the rectangle resulting from subtracting |rect| from |*this|,
// i.e. the bounding rect of |Region(*this) - Region(rect)|.
  Subtract(rect: RectLayoutUnit) {
    if (!this.Intersects(rect)) return;
    if (rect.Contains(this)) {
      this.SetRect(new LayoutUnit(), new LayoutUnit(), new LayoutUnit(), new LayoutUnit());
      return;
    }

    let rx = this.x();
    let ry = this.y();
    let rr = this.right();
    let rb = this.bottom();

    if (rect.y().LE(this.y()) && rect.bottom().GT(this.bottom())) {
      // complete intersection in the y-direction
      if (rect.x().LE(this.x())) {
        rx = rect.right();
      } else if (rect.right().GE(this.right())) {
        rr = rect.x();
      }
    } else if (rect.x().LE(this.x()) && rect.right().GE(this.right())) {
      // complete intersection in the x-direction
      if (rect.y().LE(this.y())) {
        ry = rect.bottom();
      } else if (rect.bottom().GE(this.bottom())) {
        rb = rect.y();
      }
    }
    this.SetRect(rx, ry, rr.SUB(rx), rb.SUB(ry));
  }

// Fits as much of the receiving rectangle into the supplied rectangle as
// possible, becoming the result. For example, if the receiver had
// a x-location of 2 and a width of 4, and the supplied rectangle had
// an x-location of 0 with a width of 5, the returned rectangle would have
// an x-location of 1 with a width of 4.
//   AdjustToFit(rect: RectLayoutUnit) {
//    let  new_x = this.x();
//     let  new_y =this. y();
//     let new_width = this.width();
//     let new_height = this.height();
//     AdjustAlongAxis(rect.x(), rect.width(), &new_x, &new_width);
//     AdjustAlongAxis(rect.y(), rect.height(), &new_y, &new_height);
//     this.SetRect(new_x, new_y, new_width, new_height);
//   }

// Returns the center of this rectangle.
  CenterPoint(): PointLayoutUnit {
    return new PointLayoutUnit(this.x().ADD(this.width().DIV(2)), this.y().ADD(this.height().DIV(2)));
  }

// Becomes a rectangle that has the same center point but with a size capped
// at given |size|.
  ClampToCenteredSize(size: SizeLayoutUnit) {
  }

// Splits |this| in two halves, |left_half| and |right_half|.
  SplitVertically(left_half: RectLayoutUnit, right_half: RectLayoutUnit) {
  }

// Returns true if this rectangle shares an entire edge (i.e., same width or
// same height) with the given rectangle, and the rectangles do not overlap.
//   SharesEdgeWith(rect: RectLayoutUnit): boolean {}

// Returns the manhattan distance from the rect to the point. If the point is
// inside the rect, returns 0.
  ManhattanDistanceToPoint(point: PointLayoutUnit) {
  }

// Returns the manhattan distance between the contents of this rect and the
// contents of the given rect. That is, if the intersection of the two rects
// is non-empty then the function returns 0. If the rects share a side, it
// returns the smallest non-zero value appropriate for Type.
  ManhattanInternalDistance(rect: RectLayoutUnit) {
  }
  //#endregion

  // Scales the rectangle by |scale|.
  // Scale(x_scale: number, y_scale: number) {
  //   this.set_origin(ScalePoint(this.origin(), x_scale, y_scale));
  //   this.set_size(ScaleSize(this.size(), x_scale, y_scale));
  // }

  // This method reports if the RectLayoutUnit can be safely converted to an
  // integer
  // Rect. When it is false, some dimension of the RectLayoutUnit is outside the
  // bounds
  // of what an integer can represent, and converting it to a Rect will require
  // clamping.
  //   IsExpressibleAsRect(): boolean {}

  // toString(): string {}

  static EQ(lhs: RectLayoutUnit, rhs: RectLayoutUnit) {
    return lhs.origin().EQ(rhs.origin()) && lhs.size().EQ(rhs.size());
  }
  EQ(rhs: RectLayoutUnit) {
    return RectLayoutUnit.EQ(this, rhs);
  }
  NE(rhs: RectLayoutUnit) {
    return !this.EQ(rhs);
  }
  static ADD(lhs: RectLayoutUnit, rhs: Vector2dLayoutUnit): RectLayoutUnit {
    return new RectLayoutUnit(lhs.x().ADD(rhs.x()), lhs.y().ADD(rhs.y()), lhs.width(), lhs.height());
  }

  static SUB(lhs: RectLayoutUnit, rhs: Vector2dLayoutUnit): RectLayoutUnit {
    return new RectLayoutUnit(lhs.x().SUB(rhs.x()), lhs.y().SUB(rhs.y()), lhs.width(), lhs.height());
  }

  ADD(rhs: Vector2dLayoutUnit) {
    return RectLayoutUnit.ADD(this, rhs);
  }
  // static IntersectRects(a: RectLayoutUnit, b: RectLayoutUnit): RectLayoutUnit {}
  // static UnionRects(a: RectLayoutUnit, b: RectLayoutUnit): RectLayoutUnit {}
  // static SubtractRects(a: RectLayoutUnit, b: RectLayoutUnit): RectLayoutUnit {}
  // static ScaleRect(r: RectLayoutUnit, x_scale: number, y_scale = x_scale) {
  //   return new RectLayoutUnit(r.x().MUL(x_scale), r.y().MUL(y_scale), r.width().MUL(x_scale), r.height().MUL(y_scale));
  // }
  // ructs a rectangle with |p1| and |p2| as opposite corners.
  //
  // This could also be thought of as "the smallest rect that contains both
  // points", except that we consider points on the right/bottom edges of the
  // rect to be outside the rect.  So technically one or both points will not be
  // contained within the rect, because they will appear on one of these edges.
  // static BoundingRect(p1: PointLayoutUnit, p2: PointLayoutUnit): RectLayoutUnit {
  // }

  toString() {
    return JSON.stringify({
      origin: this.origin_.toString(),
      size: this.size_.toString(),
    })
  }
}
