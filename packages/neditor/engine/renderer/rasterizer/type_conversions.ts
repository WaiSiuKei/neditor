import { Matrix3F } from '../../math/matrix3_f';
import { SkMatrix } from './skia/sk_matrix';
import { RectBase } from '../../math/rect_base';
import { SkRect, SkRect_MakeXYWH } from './skia/sk_rect';

export function CobaltMatrixToSkia(cobalt_matrix: Matrix3F): SkMatrix {
  // Shorten the variable name.
  let cm = cobalt_matrix;

  return [cm.Get(0, 0), cm.Get(0, 1), cm.Get(0, 2), cm.Get(1, 0),
    cm.Get(1, 1), cm.Get(1, 2), cm.Get(2, 0), cm.Get(2, 1),
    cm.Get(2, 2)];
}

export function CobaltRectFToSkiaRect(rect: RectBase): SkRect {
  return SkRect_MakeXYWH(rect.x(), rect.y(), rect.width(), rect.height());
}
