import { RectF } from '../math/rect_f';
import { Brush } from './brush';

export class Background {
  constructor(
    public colorBrush: Brush,
    public rect: RectF,
  ) {}
}
