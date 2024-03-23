// An image that supports scaling and tiling.
import { Matrix3 } from '../../../../base/common/geometry/matrix3';
import { PointAtOffsetFromOrigin } from '../../../../base/common/geometry/point';
import { Rect } from '../../../../base/common/geometry/rect';
import { Vector2d } from '../../../../base/common/geometry/vector2d';
import { Image } from '../components/image';
import { NodeVisitor } from '../nodeVisitor';
import { RenderTreeNode } from './baseNode';

export class ImageNodeBuilder {

  // A source of pixels. May be smaller or larger than layed out image.
  // The class does not own the image, it merely refers it from a resource
  // pool.
  source: Image;

  // The destination rectangle into which the image will be rasterized.
  destination_rect: Rect;

  // A matrix expressing how the each point within the image box (defined
  // by destination_rect) should be mapped to image data.  The identity
  // matrix would map the entire source image rectangle into the entire
  // destination rectangle.  As an example, if you were to pass in a scale
  // matrix that scales the image coordinates by 0.5 in all directions, the
  // image will appear zoomed out.
  local_transform: Matrix3 = Matrix3.Identity();
  constructor(data: ImageNodeBuilder)
  // If no width/height are specified, the native width and height of the
  // image will be selected and used as the image node's width and height.
  constructor(source: Image)
  // The specified image will render with the given width and height, which
  // may result in scaling.
  constructor(source: Image,
              destination_rect: Rect)
  // Positions the image using the unscaled source image dimensions, along
  // with a translation offset.
  constructor(source: Image,
              offset: Vector2d)
  // Allows users to additionally supply a local matrix to be applied to the
  // normalized image coordinates.
  constructor(source: Image,
              destination_rect: Rect,
              local_transform: Matrix3)
  constructor(a1: Image | ImageNodeBuilder,
              a2?: Rect | Vector2d,
              local_transform?: Matrix3) {
    if (arguments.length === 1) {
      if (a1 instanceof ImageNodeBuilder) {
        this.source = a1.source;
        this.destination_rect = a1.destination_rect;
        this.local_transform = a1.local_transform;
      } else {
        this.source = a1;
        this.destination_rect = a1 ? new Rect(a1.GetSize()) : new Rect();
      }
    } else if (arguments.length === 2) {
      this.source = a1 as Image;
      if (a2 instanceof Rect) {
        this.destination_rect = a2;
      } else {
        this.destination_rect = new Rect(PointAtOffsetFromOrigin(a2 as Vector2d), this.source.GetSize());
      }
    } else {
      this.source = a1 as Image;
      this.destination_rect = a2 as Rect;
      this.local_transform = local_transform!;
    }
  }

  EQ(other: ImageNodeBuilder) {
    return this.source == other.source &&
      this.destination_rect == other.destination_rect &&
      this.local_transform == other.local_transform;
  }
}

export class ImageNode extends RenderTreeNode {

  constructor(...args: unknown[]) {
    super();
    // @ts-ignore
    this.data_ = new ImageNodeBuilder(...args);
  }

  accept(visitor: NodeVisitor) {
    visitor.VisitImageNode(this);
  }
  getBounds(): Rect {
    return this.data_.destination_rect;
  }

  data() { return this.data_; }

  private data_: ImageNodeBuilder;
}
