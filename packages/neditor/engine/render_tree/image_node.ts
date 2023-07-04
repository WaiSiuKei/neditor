// An image that supports scaling and tiling.
import { Node } from './node';
import { Image } from './image';
import { Vector2dF } from '../math/vector2d_f';
import { RectF } from '../math/rect_f';
import { Matrix3F } from '../math/matrix3_f';
import { NodeVisitor } from './node_visitor';
import { baseGetTypeId } from '../base/type_id';
import { PointAtOffsetFromOrigin } from '../math/point_f';

export class ImageNodeBuilder {

  // A source of pixels. May be smaller or larger than layed out image.
  // The class does not own the image, it merely refers it from a resource
  // pool.
  source: Image;

  // The destination rectangle into which the image will be rasterized.
  destination_rect: RectF;

  // A matrix expressing how the each point within the image box (defined
  // by destination_rect) should be mapped to image data.  The identity
  // matrix would map the entire source image rectangle into the entire
  // destination rectangle.  As an example, if you were to pass in a scale
  // matrix that scales the image coordinates by 0.5 in all directions, the
  // image will appear zoomed out.
  local_transform: Matrix3F = Matrix3F.Identity();
  constructor(builder: ImageNodeBuilder)
  // If no width/height are specified, the native width and height of the
  // image will be selected and used as the image node's width and height.
  constructor(source: Image)
  // The specified image will render with the given width and height, which
  // may result in scaling.
  constructor(source: Image, destination_rect: RectF)
  // Positions the image using the unscaled source image dimensions, along
  // with a translation offset.
  constructor(source: Image, offset: Vector2dF)
  // Allows users to additionally supply a local matrix to be applied to the
  // normalized image coordinates.
  constructor(source: Image, destination_rect: RectF, local_transform: Matrix3F)
  constructor(a1: Image | ImageNodeBuilder, a2?: RectF | Vector2dF, local_transform?: Matrix3F) {
    if (arguments.length === 1) {
      if (a1 instanceof ImageNodeBuilder) {
        this.source = a1.source;
        this.destination_rect = a1.destination_rect;
        this.local_transform = a1.local_transform;
      } else {
        this.source = a1;
        this.destination_rect = a1 ? new RectF(a1.GetSize()) : new RectF();
      }
    } else if (arguments.length === 2) {
      this.source = a1 as Image;
      if (a2 instanceof RectF) {
        this.destination_rect = a2;
      } else {
        this.destination_rect = new RectF(PointAtOffsetFromOrigin(a2 as Vector2dF), this.source.GetSize());
      }
    } else {
      this.source = a1 as Image;
      this.destination_rect = a2 as RectF;
      this.local_transform = local_transform!;
    }
  }

  EQ(other: ImageNodeBuilder) {
    return this.source == other.source &&
      this.destination_rect == other.destination_rect &&
      this.local_transform == other.local_transform;
  }
};

export class ImageNode extends Node {

  constructor(...args: unknown[]) {
    super();
    // @ts-ignore
    this.data_ = new ImageNodeBuilder(...args);
  }

  Accept(visitor: NodeVisitor) {
    visitor.VisitImageNode(this);
  }
  GetBounds(): RectF {
    return this.data_.destination_rect;
  }

  GetTypeId() {
    return baseGetTypeId(ImageNode);
  }

  data() { return this.data_; }

  private data_: ImageNodeBuilder;
};
