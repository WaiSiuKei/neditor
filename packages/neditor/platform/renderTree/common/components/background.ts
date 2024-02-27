import { Rect } from '../../../../base/common/geometry/rect';
import { Brush } from './brush';

export class Background {
  constructor(
    public colorBrush: Brush,
    public rect: Rect,
  ) {}
}
