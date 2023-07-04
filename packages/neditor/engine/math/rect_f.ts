import { RectBase } from './rect_base';
import type { RectLayoutUnit } from "../layout/rect_layout_unit";

export class RectF extends RectBase {
  static fromRectLayoutUnit(u: RectLayoutUnit): RectF {
    const origin = u.origin()
    const size = u.size()
    return new RectF(origin.x().toFloat(), origin.y().toFloat(), size.width().toFloat(), size.height().toFloat())
  }
}
