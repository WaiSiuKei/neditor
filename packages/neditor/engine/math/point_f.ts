import { PointBase } from './point_base';
import { Vector2dF } from './vector2d_f';

export class PointF extends PointBase {}

export function PointAtOffsetFromOrigin( offset_from_origin : Vector2dF) {
  return new PointF(offset_from_origin.x(), offset_from_origin.y());
}
