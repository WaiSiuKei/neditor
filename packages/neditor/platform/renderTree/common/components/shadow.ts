// Describes a shadow effect that can be applied as a filter or to a shape.
// The |blur_sigma| value is given in units of Gaussian standard deviations for
// the Gaussian kernel that will be used to blur them.
import { Rect } from '../../../../base/common/geometry/rect';
import { Vector2d } from '../../../../base/common/geometry/vector2d';
import { ColorRGBA } from './colorRgba';

export class Shadow {
  offset: Vector2d;
  blur_sigma: number;
  color: ColorRGBA;
  constructor(
    offset: Vector2d,
    blur_sigma: number,
    color: ColorRGBA,
  ) {
    this.offset = offset;
    this.blur_sigma = blur_sigma;
    this.color = color;
  }
  // Since the blur parameters represent standard deviations, most of the
  // blur is contained within 3 of them, so report that as the extent of the
  // blur.
  BlurExtent(): Vector2d {
    return new Vector2d(this.blur_sigma * 3, this.blur_sigma * 3);
  }

  // Returns a bounding rectangle for the shadow if it were to be applied to
  // the input bounding rectangle.
  ToShadowBounds(source_bound: Rect): Rect {
    let ret = new Rect(source_bound);
    ret.offset(this.offset);

    let blur_extent: Vector2d = this.BlurExtent();
    ret.Outset(blur_extent.x, blur_extent.y);
    return ret;
  }
}
