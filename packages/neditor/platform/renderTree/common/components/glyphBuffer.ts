import { Rect } from '../../../../base/common/geometry/rect';

// The GlyphBuffer class is a base class, which contains the data needed to
// render shaped text. It is intended to be immutable and thread-safe. Since
// GlyphBuffer objects may be created in the front-end, but must be accessed
// by the rasterizer, it is expected that they will be downcast again to a
// rasterizer-specific type through base::polymorphic_downcast().

export class GlyphBuffer {
  private bounds_: Rect;
  constructor(bounds: Rect) {
    this.bounds_ = bounds;
  }

  GetBounds() {
    return this.bounds_;
  }
}

