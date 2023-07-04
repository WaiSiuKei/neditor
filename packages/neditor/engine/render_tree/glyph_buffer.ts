// The GlyphBuffer class is a base class, which contains the data needed to
// render shaped text. It is intended to be immutable and thread-safe. Since
// GlyphBuffer objects may be created in the front-end, but must be accessed
// by the rasterizer, it is expected that they will be downcast again to a
// rasterizer-specific type through base::polymorphic_downcast().
import { RectF } from '../math/rect_f';
import { Disposable } from "../../base/common/lifecycle";

export class GlyphBuffer extends Disposable {
  private bounds_: RectF;
  constructor(bounds: RectF) {
    super()
    this.bounds_ = bounds;
  }

  GetBounds() {
    return this.bounds_;
  }
}

