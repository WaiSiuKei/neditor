import { Rect } from '../../../../base/common/geometry/rect';
import { Border } from '../components/border';
import { Brush } from '../components/brush';
import { RoundedCorners } from '../components/roundedCorners';
import { NodeVisitor } from '../nodeVisitor';
import { RenderTreeNode } from './baseNode';

export class RectNodeBuilder {

  // The destination rectangle (size includes border).
  rect: Rect;

  // A solid or gradient brush to fill the rectangle with.
  // This can be null if a background brush is not specified.
  background_brush?: Brush;

  // A border arounds a RectNode.
  border?: Border;

  // Defines the radii of an ellipse that defines the shape of the corner of
  // the outer border edge.
  rounded_corners?: RoundedCorners;
  constructor(rect: Rect | RectNodeBuilder,
              background_brush?: Brush,
              border?: Border,
              rounded_corners?: RoundedCorners) {
    if (rect instanceof RectNodeBuilder) {
      this.rect = rect.rect.CLONE();
      this.background_brush = rect.background_brush;
      this.border = rect.border;
      this.rounded_corners = rect.rounded_corners;
    } else {
      this.rect = rect.CLONE();
      this.background_brush = background_brush;
      this.border = border;
      this.rounded_corners = rounded_corners;
    }
  }

  EQ(other: RectNodeBuilder): boolean {
    throw new Error('500');
    // let  brush_equals = !this.background_brush && !other.background_brush;
    // if (this.background_brush && other.background_brush) {
    //   EqualsBrushVisitor brush_equals_visitor(background_brush.get());
    //   other.background_brush->Accept(&brush_equals_visitor);
    //   brush_equals = brush_equals_visitor.result();
    // }
    // bool border_equals = (!border && !other.border) ||
    //   (border && other.border && *border == *other.border);
    // bool rounded_corners_equals = (!rounded_corners && !other.rounded_corners) ||
    //   (rounded_corners && other.rounded_corners &&
    //     *rounded_corners == *other.rounded_corners);
    //
    // return rect == other.rect && brush_equals && border_equals &&
    //   rounded_corners_equals;
  }
}

// A filled rectangle with a border and rounded corners.
export class RectNode extends RenderTreeNode {
  private data_: RectNodeBuilder;

  constructor(builder: RectNodeBuilder)
  constructor(rect: Rect,
              background_brush?: Brush,
              border?: Border,
              rounded_corners?: RoundedCorners)
  constructor(rect: Rect | RectNodeBuilder,
              background_brush?: Brush,
              border?: Border,
              rounded_corners?: RoundedCorners) {
    super();
    if (rect instanceof RectNodeBuilder) {
      this.data_ = new RectNodeBuilder(rect);
    } else {
      this.data_ = new RectNodeBuilder(rect, background_brush, border, rounded_corners);
    }
  }

  accept(visitor: NodeVisitor) {
    visitor.VisitRectNode(this);
  }
  getBounds() {
    return this.data_.rect;
  }

  data() {
    return this.data_;
  }
}

