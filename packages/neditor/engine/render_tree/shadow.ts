// Describes a shadow effect that can be applied as a filter or to a shape.
// The |blur_sigma| value is given in units of Gaussian standard deviations for
// the Gaussian kernel that will be used to blur them.
import { Vector2dF } from '../math/vector2d_f';
import { ColorRGBA } from './color_rgba';
import { RectF } from '../math/rect_f';

export class Shadow {
  offset: Vector2dF;
  blur_sigma: number;
  color: ColorRGBA;
  constructor(
    offset: Vector2dF,
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
  BlurExtent(): Vector2dF {
    return new Vector2dF(this.blur_sigma * 3, this.blur_sigma * 3);
  }

  // Returns a bounding rectangle for the shadow if it were to be applied to
  // the input bounding rectangle.
  ToShadowBounds(source_bound: RectF): RectF {
    let ret = new RectF(source_bound);
    ret.Offset(this.offset);

    let blur_extent: Vector2dF = this.BlurExtent();
    ret.Outset(blur_extent.x(), blur_extent.y());
    return ret;
  }
}
