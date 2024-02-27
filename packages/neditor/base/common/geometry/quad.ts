// A Quad is defined by four corners, allowing it to have edges that are not
// axis-aligned, unlike a Rect.
import { Point } from './point';
import { Matrix3 } from './matrix3';
import { Rect } from './rect';

export class Quad {
  private p1_: Point;
  private p2_: Point;
  private p3_: Point;
  private p4_: Point;

  static fromRect(rect: Rect) {
    return new Quad(
      new Point(rect.x, rect.y),
      new Point(rect.right, rect.y),
      new Point(rect.right, rect.bottom),
      new Point(rect.x, rect.bottom)
    );
  }

  constructor(p1: Point,
              p2: Point,
              p3: Point,
              p4: Point,) {
    this.p1_ = p1;
    this.p2_ = p2;
    this.p3_ = p3;
    this.p4_ = p4;

  }

  // Creates a quad by multiplying the corner points of the given rectangle by
  // the given matrix.
  static FromMatrix3AndRect(
    matrix: Matrix3,
    rect: Rect,
  ) {
    return new Quad(
      matrix.MUL(new Point(rect.x, rect.y)),
      matrix.MUL(new Point(rect.right, rect.y)),
      matrix.MUL(new Point(rect.right, rect.bottom)),
      matrix.MUL(new Point(rect.x, rect.bottom))
    );
  }

  // static FromRectF(
  //   rect: RectF,
  // ) {
  //   return new QuadF(
  //     new Point(rect.x(), rect.y()),
  //     new Point(rect.right(), rect.y()),
  //     new Point(rect.right(), rect.bottom()),
  //     new Point(rect.x(), rect.bottom())
  //   );
  // }

  // ASSIGN( rect: RectF){
  //
  // }
  //
  //  SetQuad(  p1: Point, p2: Point, p3: Point, p4: Point,) {
  //    set_p1(p1);
  //    set_p2(p2);
  //    set_p3(p3);
  //    set_p4(p4);
  //  }

  //   set_p1(p: Point) { p1_ = p; }
  //  set_p2(p: Point) { p2_ = p; }
  //   set_p3(p: Point) { p3_ = p; }
  //  set_p4(p: Point) { p4_ = p; }
  //
  //   p1()  { return p1_; }
  //    p2()  { return p2_; }
  // p3() { return p3_; }
  //   p4()  { return p4_; }

  // Returns true if the quad is an axis-aligned rectangle.
  // IsRectilinear(): boolean {}

  // Returns true if the points of the quad are in counter-clockwise order. This
  // assumes that the quad is convex, and that no three points are collinear.
  // IsCounterClockwise() : boolean {}

  // Returns true if the |point| is contained within the quad, or lies on on
  // edge of the quad. This assumes that the quad is convex.
  // Contains(   point: Point) : boolean {}

  // Returns a rectangle that bounds the four points of the quad. The points of
  // the quad may lie on the right/bottom edge of the resulting rectangle,
  // rather than being strictly inside it.
  BoundingBox() {
    const { p1_, p2_, p3_, p4_ } = this;
    let rl = Math.min(Math.min(p1_.x, p2_.x), Math.min(p3_.x, p4_.x));
    let rr = Math.max(Math.max(p1_.x, p2_.x), Math.max(p3_.x, p4_.x));
    let rt = Math.min(Math.min(p1_.y, p2_.y), Math.min(p3_.y, p4_.y));
    let rb = Math.max(Math.max(p1_.y, p2_.y), Math.max(p3_.y, p4_.y));
    return new Rect(rl, rt, rr - rl, rb - rt);
  }

  // Add a vector to the quad, offseting each point in the quad by the vector.
  // void operator+=(const Vector2dF& rhs);
  // Subtract a vector from the quad, offseting each point in the quad by the
  // inverse of the vector.
  // void operator-=(const Vector2dF& rhs);

  // Scale each point in the quad by the |scale| factor.
  // void Scale(float scale) { Scale(scale, scale); }

  // Scale each point in the quad by the scale factors along each axis.
  // void Scale(float x_scale, float y_scale);

  // Returns a string representation of quad.
  // std::string ToString()

};

// inline bool operator==(const QuadF& lhs, const QuadF& rhs) {
//   return lhs.p1() == rhs.p1() && lhs.p2() == rhs.p2() && lhs.p3() == rhs.p3() &&
//          lhs.p4() == rhs.p4();
// }
//
// inline bool operator!=(const QuadF& lhs, const QuadF& rhs) {
//   return !(lhs == rhs);
// }
//
// // Add a vector to a quad, offseting each point in the quad by the vector.
// QuadF operator+(const QuadF& lhs, const Vector2dF& rhs);
// // Subtract a vector from a quad, offseting each point in the quad by the
// // inverse of the vector.
// QuadF operator-(const QuadF& lhs, const Vector2dF& rhs);
