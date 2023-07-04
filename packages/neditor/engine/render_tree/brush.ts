// A base class of all render tree brushes.
import { baseGetTypeId as baseGetTypeId, TypeId } from '../base/type_id';
import { ColorRGBA } from './color_rgba';
import { BrushVisitor } from './brush_visitor';
import { isNil, isNumber } from '@neditor/core/base/common/type';
import { PointF } from '../math/point_f';
import { SizeF } from '../math/size_f';
import { DCHECK_GE, DCHECK_LE } from '@neditor/core/base/check_op';
import { DCHECK } from '@neditor/core/base/check';
import { equals } from '@neditor/core/base/common/array';
import { deepClone } from '@neditor/core/base/common/objects';

export abstract class Brush {
  // A type-safe branching.
  abstract Accept(visitor: BrushVisitor): void;

  // Returns an ID that is unique to the brush type.  This can be used to
  // polymorphically identify what type a brush is.
  abstract GetTypeId(): TypeId
}

export class SolidColorBrush extends Brush {
  private color_: ColorRGBA;
  constructor(color: ColorRGBA) {
    super();
    this.color_ = color;
  }

  EQ(other: SolidColorBrush) {
    return this.color_ == other.color_;
  }

  // A type-safe branching.
  Accept(visitor: BrushVisitor) {
    visitor.visitSolidColorBrush(this);
  }

  static GetTypeId(): TypeId {
    return baseGetTypeId(SolidColorBrush);
  }

  GetTypeId(): TypeId {
    return baseGetTypeId(SolidColorBrush);
  }

  color(): ColorRGBA { return this.color_; }

  CLONE(): SolidColorBrush {
    return new SolidColorBrush(this.color_.CLONE());
  }
}

// ColorStops are used to describe linear and radial gradients.  For linear
// gradients, |position| represents the faction between the source and
// destination points that |color| should be applied.  For radial gradients,
// it represents the fraction between the center point and radius at which
// |color| should apply.  In both cases, 0 <= |position| <= 1.
class ColorStop {
  position: number = -1;
  color: ColorRGBA = new ColorRGBA(0, 0, 0, 0);
  constructor(position?: number, color?: ColorRGBA) {
    if (!isNil(position)) this.position = position;
    if (color) this.color = color;
  }

  EQ(other: ColorStop) {
    return this.position === other.position && this.color.EQ(other.color);
  }

  CLONE(): ColorStop {
    return new ColorStop(this.position, this.color.CLONE());
  }
}

// Returns true if and only if two color stops are very close to each other.
function IsNearColorStop(lhs: ColorStop,
                         rhs: ColorStop, epsilon: number) {
  if (Math.abs(lhs.position - rhs.position) > epsilon) return false;
  return lhs.color == rhs.color;
}

export type ColorStopList = ColorStop[]

function IsNearColorStopList(lhs: ColorStopList, rhs: ColorStopList, epsilon: number) {
  if (lhs.length != rhs.length) return false;
  for (let i = 0; i != lhs.length; ++i) {
    if (!IsNearColorStop(lhs[i], rhs[i], epsilon)) return false;
  }
  return true;
}
// Calculate the source and destination points to use for a linear gradient
// of the specified angle to cover the given frame.
//
// The method of defining the source and destination points for the linear
// gradient are defined here:
//   https://www.w3.org/TR/2012/CR-css3-images-20120417/#linear-gradients
//
// "Starting from the center of the gradient box, extend a line at the
//  specified angle in both directions. The ending point is the point on the
//  gradient line where a line drawn perpendicular to the gradient line would
//  intersect the corner of the gradient box in the specified direction. The
//  starting point is determined identically, but in the opposite direction."
// function  LinearGradientPointsFromAngle(
//    ccw_radians_from_right: number,  frame_size: SizeF): [ PointF,  PointF]
// {
// }

// Linear gradient brushes can be used to fill a shape with a linear color
// gradient with arbitrary many color stops.  It is specified by a source
// and destination point, which define a line segment along which the color
// stops apply, each having a position between 0 and 1 representing the
// position of the stop along that line.  Interpolation occurs in premultiplied
// alpha space.
// NOTE: The source and destination points may lie inside or outside the shape
// which uses the gradient brush. Always consider the shape as a mask over the
// gradient whose first and last color stops extend infinitely in their
// respective directions.
class LinearGradientBrushData {
  source_: PointF = new PointF();
  dest_: PointF = new PointF();

  color_stops_: ColorStopList = [];
  constructor()
  constructor(source: PointF, dest: PointF)
  constructor(source: PointF, dest: PointF, color_stops: ColorStopList)
  constructor(source?: PointF, dest?: PointF, color_stops?: ColorStopList) {
    if (source) this.source_ = source;
    if (dest) this.dest_ = dest;
    if (color_stops) {
      this.color_stops_ = color_stops;
      ValidateColorStops(color_stops);
    }
  }

  EQ(other: LinearGradientBrushData): boolean {
    return this.source_.EQ(other.source_) && this.dest_.EQ(other.dest_) &&
      equals(this.color_stops_, other.color_stops_, (a: ColorStop, b: ColorStop) => a.EQ(b));
  }

  CLONE(): LinearGradientBrushData {
    return new LinearGradientBrushData(deepClone(this.source_), deepClone(this.dest_), deepClone(this.color_stops_));
  }
}

function ValidateColorStops(color_stops: ColorStopList) {
  // Verify that the data is valid.  In particular, there should be at least
  // two color stops and they should be sorted by position.
  DCHECK_LE(2, color_stops.length);
  for (let i = 0; i < color_stops.length; ++i) {
    DCHECK_LE(0.0, color_stops[i].position);
    DCHECK_GE(1.0, color_stops[i].position);
    if (i > 0) {
      DCHECK_GE(color_stops[i].position, color_stops[i - 1].position);
    }
  }
}

export class LinearGradientBrush extends Brush {
  data_: LinearGradientBrushData;
  // The ColorStopList passed into LinearGradientBrush must have at least two
  // stops and they must be sorted in order of increasing position.
  constructor(source: PointF, dest: PointF, color_stops: ColorStopList)
  constructor(source: PointF, dest: PointF, source_color: ColorRGBA, dest_color: ColorRGBA)
  constructor(source: PointF, dest: PointF, a3: unknown, a4?: unknown) {
    super();
    if (a3 instanceof ColorRGBA) {
      this.data_ = new LinearGradientBrushData(source, dest);
      this.data_.color_stops_.push(new ColorStop(0, a3 as ColorRGBA));
      this.data_.color_stops_.push(new ColorStop(1, a4 as ColorRGBA));
    } else {
      this.data_ = new LinearGradientBrushData(source, dest, a3 as ColorStopList);
    }
  }

  EQ(other: LinearGradientBrush) {
    return this.data_.EQ(other.data_);
  }

  CLONE() {
    return new LinearGradientBrush(deepClone(this.data_.source_), deepClone(this.data_.dest_), deepClone(this.data_.color_stops_));
  }

  // A type-safe branching.
  Accept(visitor: BrushVisitor) {
    visitor.visitLinearGradientBrush(this);
  }

  GetTypeId(): TypeId {
    return baseGetTypeId(LinearGradientBrush);
  }

  // Returns the source and destination points of the linear gradient.
  source(): PointF { return this.data_.source_; }
  dest(): PointF { return this.data_.dest_; }

  // Returns the list of color stops along the line segment between the source
  // and destination points.
  color_stops(): ColorStopList { return this.data_.color_stops_; }

  // Returns true if, and only if the brush is horizontal.
  IsHorizontal(epsilon = 0.001) {
    return Math.abs(this.data_.source_.y() - this.data_.dest_.y()) < epsilon;
  }

  // Returns true if, and only if the brush is vertical.
  IsVertical(epsilon = 0.001) {
    return Math.abs(this.data_.source_.x() - this.data_.dest_.x()) < epsilon;
  }

  data() { return this.data_; }
}

// A radial gradient brush can be used to fill a shape with a color gradient
// that expands from a given center point up to a specified radius.  The list
// of color stops have position values between 0 and 1 which represent the
// distance between the center point and the specified x-axis radius that the
// color should apply to.  Interpolation occurs in premultiplied alpha space.
export class RadialGradientBrush extends Brush {
  private center_: PointF = new PointF();
  private radius_x_: number = 0;
  private radius_y_: number = 0;

  private color_stops_: ColorStopList = [];
  // The ColorStopList passed into RadialGradientBrush must have at least two
  // stops and they must be sorted in order of increasing position.
  constructor(center: PointF, radius: number, color_stops: ColorStopList)
  constructor(center: PointF, radius_x: number, radius_y: number, color_stops: ColorStopList)
  constructor(center: PointF, radius: number, source_color: ColorRGBA, dest_color: ColorRGBA)
  constructor(center: PointF, radius_x: number, radius_y: number, source_color: ColorRGBA, dest_color: ColorRGBA)
  constructor(center: PointF, a2: number, a3: unknown, a4?: unknown, a5?: ColorRGBA) {
    super();
    this.center_ = center;
    this.radius_x_ = a2;
    if (arguments.length === 3) {
      this.radius_y_ = a2 as number;
    } else if (arguments.length === 4) {
      if (isNumber(a3)) {
        this.radius_y_ = a3 as number;
        this.color_stops_ = a4 as ColorStopList;
      } else {
        this.radius_y_ = a2;
        this.color_stops_.push(new ColorStop(0, a3 as ColorRGBA));
        this.color_stops_.push(new ColorStop(1, a4 as ColorRGBA));
      }
    } else if (arguments.length === 5) {
      this.radius_y_ = a3 as number;
      this.color_stops_.push(new ColorStop(0, a4 as ColorRGBA));
      this.color_stops_.push(new ColorStop(1, a5 as ColorRGBA));
    }
  }

  EQ(other: RadialGradientBrush) {
    return this.center_ == other.center_ && this.radius_x_ == other.radius_x_ &&
      this.radius_y_ == other.radius_y_ && this.color_stops_ == other.color_stops_;
  }

  CLONE(): RadialGradientBrush {
    return new RadialGradientBrush(deepClone(this.center_), this.radius_x_, this.radius_y_, deepClone(this.color_stops_));
  }

  // A type-safe branching.
  Accept(visitor: BrushVisitor) {
    visitor.visitRadialGradientBrush(this);
  }

  GetTypeId() {
    return baseGetTypeId(RadialGradientBrush);
  }

  // Returns the source and destination points of the linear gradient.
  center() { return this.center_; }
  radius_x() { return this.radius_x_; }
  radius_y() { return this.radius_y_; }

  // Returns the list of color stops from the center point to the radius.
  color_stops() { return this.color_stops_; }
}

export function CloneBrush(brush: Brush): Brush {
  DCHECK(brush);

  let cloner = new BrushCloner();
  brush.Accept(cloner);
  return cloner.PassClone();
}

// parse abstract class BaseBrushVisitor extends BrushVisitor {
//   // visit(brush: Brush) {
//   //   if (brush instanceof SolidColorBrush) this.visitSolidColorBrush(brush);
//   //   if (brush instanceof LinearGradientBrush) this.visitLinearGradientBrush(brush);
//   //   if (brush instanceof RadialGradientBrush) this.visitRadialGradientBrush(brush);
//   // }
//   abstract visitSolidColorBrush(solid_color_brush: SolidColorBrush): void;
//   abstract visitLinearGradientBrush(linear_gradient_brush: LinearGradientBrush): void
//   abstract visitRadialGradientBrush(radial_gradient_brush: RadialGradientBrush): void
// }

class BrushCloner extends BrushVisitor {
  private cloned_?: Brush;
  visitSolidColorBrush(solid_color_brush: SolidColorBrush) {
    this.cloned_ = solid_color_brush.CLONE();
  }

  visitLinearGradientBrush(linear_gradient_brush: LinearGradientBrush) {
    this.cloned_ = linear_gradient_brush.CLONE();
  }

  visitRadialGradientBrush(radial_gradient_brush: RadialGradientBrush) {
    this.cloned_ = radial_gradient_brush.CLONE();
  }

  PassClone() { return this.cloned_!; }
}

class EqualsBrushVisitor extends BrushVisitor {
  brush_a_: Brush;
  result_: boolean = false;

  constructor(brush_a: Brush) {
    super();
    this.brush_a_ = brush_a;
  }

  result() { return this.result_; }

  visitSolidColorBrush(solid_color_brush: SolidColorBrush) {
    this.result_ = this.brush_a_ instanceof SolidColorBrush && solid_color_brush.EQ(this.brush_a_);
  }

  visitLinearGradientBrush(linear_gradient_brush: LinearGradientBrush) {
    this.result_ = this.brush_a_ instanceof LinearGradientBrush && linear_gradient_brush.EQ(this.brush_a_);
  }

  visitRadialGradientBrush(radial_gradient_brush: RadialGradientBrush) {
    this.result_ = this.brush_a_ instanceof RadialGradientBrush && radial_gradient_brush.EQ(this.brush_a_);
  }
}
