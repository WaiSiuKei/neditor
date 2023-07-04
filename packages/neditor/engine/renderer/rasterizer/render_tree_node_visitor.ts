// This callback may be called by the visitor in order to obtain a SkSurface
// from which both a SkCanvas can be obtained (for rendering into) and then
// a SkImage can be obtained which can be passed in to another SkCanvas'
// drawImage function.  The surface returned is guaranteed to have been
// cleared to ARGB(0,0,0,0).
import { Canvas, Surface, Paint } from 'canvaskit-wasm';
import { NodeVisitor } from '../../render_tree/node_visitor';
import { Size } from '../../math/size';
import { RenderTreeNodeVisitorDrawState } from './render_tree_node_visitor_draw_state';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { ClearRectNode } from '../../render_tree/clear_rect_node';
import { RectF } from '../../math/rect_f';
import { ColorRGBA } from '../../render_tree/color_rgba';
import { SkRect, SkRect_MakeXYWH } from './skia/sk_rect';
import { CompositionNode } from '../../render_tree/composition_node';
import { MatrixTransformNode } from '../../render_tree/matrix_transform_node';
import { RectNode } from '../../render_tree/rect_node';
import { TextNode } from '../../render_tree/text_node';
import { SkMatrix } from './skia/sk_matrix';
import { Node } from '../../render_tree/node';
import { CobaltMatrixToSkia, CobaltRectFToSkiaRect } from './type_conversions';
import { RoundedCorners } from '../../render_tree/rounded_corners';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import {
  Brush,
  ColorStopList,
  LinearGradientBrush,
  RadialGradientBrush,
  SolidColorBrush
} from '../../render_tree/brush';
import { BrushVisitor } from '../../render_tree/brush_visitor';
import { IsOpaque } from './common/utils';
import { SkColor } from './skia/sk_color';
import { SkScalar } from './skia/sk_scalar';
import { SkPoint } from './skia/sk_point';
import { DCHECK_EQ } from '@neditor/core/base/check_op';
import { Shadow } from '../../render_tree/shadow';
import { PointAtOffsetFromOrigin, PointF } from '../../math/point_f';
import { SkGradientShader } from './skia/effects/SkGradientShader';
import { GlyphBuffer } from './sk_glyph_buffer';
import { ImageNode } from '../../render_tree/image_node';
import { MultiPlaneImage, SinglePlaneImage } from './sk_image';
import { Image as BaseImage } from '../../render_tree/image';
import { isFunction } from '@neditor/core/base/common/type';
import { baseGetTypeId } from '../../base/type_id';
import { Callback1, Callback2, Closure } from '@neditor/core/base/callback';
import { IsOnlyScaleAndTranslate } from '../../math/transform_2d';
import { Matrix3F } from '../../math/matrix3_f';
import { CanvasKit, makePaint, MakePathFromSVGString } from '@neditor/skia';
import { devicePixelRatio } from '@neditor/core/base/browser/devicePixelRatio';
import { FreehandNode } from "../../render_tree/freehand_node";
import { Path } from "../../render_tree/path";
import { AccessorCallback, Optional } from "../../../base/common/typescript";

export abstract class ScratchSurface {
  abstract GetSurface(): Surface
}

export type CreateScratchSurfaceFunction = (size: Size) => ScratchSurface
export type ConvertRenderTreeToImageCallback = Callback1<BaseImage, Node>

enum Type {
  kType_Normal,
  kType_SubVisitor,
};

export class RenderTreeNodeVisitor extends NodeVisitor {
  private draw_state_: RenderTreeNodeVisitorDrawState;
  private create_scratch_surface_function_: CreateScratchSurfaceFunction;
  private visitor_type_: Type;

  private reset_skia_context_function_?: Closure;

  // private render_image_fallback_function_: RenderImageFallbackFunction;
  // RenderImageWithMeshFallbackFunction render_image_with_mesh_function_;
  private convert_render_tree_to_image_function_: ConvertRenderTreeToImageCallback;

  // Helper function to render the filter's source to an offscreen surface and
  // then apply the filter to the offscreen surface.
  // private RenderFilterViaOffscreenSurface( filter_node: FilterNodeBuilder) {
  //
  // }

  // The create_scratch_surface_function functor object will be saved within
  // RenderTreeNodeVisitor, so it must outlive the RenderTreeNodeVisitor
  // object.  If |is_sub_visitor| is set to true, errors will be supported for
  // certain operations such as punch out alpha textures, as it is unfortunately
  // difficult to implement them when rendering to a sub-canvas.  If
  // |render_image_fallback_function| is specified, it will be invoked whenever
  // standard Skia processing of the image is not possible, which usually is
  // when the image is backed by a SbDecodeTarget that requires special
  // consideration.  |render_image_with_mesh| must be specified
  // in order to support the map-to-mesh filter since Skia is unable to draw
  // 3D meshes natively.
  // RenderTreeNodeVisitor(
  //     SkCanvas* render_target,
  //     const CreateScratchSurfaceFunction* create_scratch_surface_function,
  //     const base::Closure& reset_skia_context_function,
  //     const RenderImageFallbackFunction& render_image_fallback_function,
  //     const RenderImageWithMeshFallbackFunction& render_image_with_mesh,
  //     const ConvertRenderTreeToImageCallback&
  //         convert_render_tree_to_image_function,
  //     Type visitor_type = kType_Normal);
  constructor(
    render_target: Canvas,
    create_scratch_surface_function: CreateScratchSurfaceFunction,
    reset_skia_context_function: Closure,
    // render_image_fallback_function: RenderImageFallbackFunction,
    convert_render_tree_to_image_function: ConvertRenderTreeToImageCallback,
    visitor_type = Type.kType_Normal
  ) {
    super();
    this.draw_state_ = new RenderTreeNodeVisitorDrawState(render_target);
    this.visitor_type_ = visitor_type;
    this.create_scratch_surface_function_ = create_scratch_surface_function;
    this.reset_skia_context_function_ = reset_skia_context_function;
    // this.render_image_fallback_function_ = render_image_fallback_function;
    this.convert_render_tree_to_image_function_ = convert_render_tree_to_image_function;
  }
  VisitClearRectNode(clear_rect_node: ClearRectNode): void {
    TRACE_EVENT0('cobalt::renderer', 'Visit(ClearRectNode)');
    this.withScaleAndTranslate(() => {
      this.DrawClearRect(clear_rect_node.data().rect, clear_rect_node.data().color);
    })
  }
  VisitCompositionNode(composition_node: CompositionNode): void {
    TRACE_EVENT0('cobalt::renderer', 'Visit(CompositionNode)');

    let children =
      composition_node.data().children();

    if (children.length === 0) {
      return;
    }

    const { draw_state_ } = this;

    draw_state_.render_target.translate(composition_node.data().offset().x() * devicePixelRatio,
      composition_node.data().offset().y() * devicePixelRatio);

    // If we have more than one child (there is little to be gained by performing
    // these calculations otherwise since our bounding rectangle is equal to
    // our child's), retrieve our current total matrix and canvas viewport
    // rectangle so that we can later check if each child is within or outside
    // the viewport.
    let canvas_bounds: SkRect = [0, 0, 1280, 720];
    let total_matrix: SkMatrix = draw_state_.render_target.getTotalMatrix();

    for (let child of children) {
      // No need to proceed if the child node is outside our canvas' viewport
      // rectangle.
      if (!canvas_bounds ||
        NodeIsWithinCanvasBounds(total_matrix, canvas_bounds, child)) {
        child.Accept(this);
      }
    }

    draw_state_.render_target.translate(-composition_node.data().offset().x() * devicePixelRatio,
      -composition_node.data().offset().y() * devicePixelRatio);

    // #if ENABLE_FLUSH_AFTER_EVERY_NODE
    // draw_state_.render_target.flush();
    // #endif
  }
  VisitMatrixTransformNode(matrix_transform_node: MatrixTransformNode): void {
    TRACE_EVENT0('cobalt::renderer', 'Visit(MatrixTransformNode)');

    this.withScaleAndTranslate(() => {
      const { draw_state_ } = this;
      // Concatenate the matrix transform to the render target and then continue
      // on with rendering our source.

      const mx = matrix_transform_node.data().transform.CLONE();
      mx.MUL(new PointF(devicePixelRatio, devicePixelRatio));
      draw_state_.render_target.concat(CobaltMatrixToSkia(mx));

      matrix_transform_node.data().source.Accept(this);

      // #if ENABLE_FLUSH_AFTER_EVERY_NODE
      // draw_state_.render_target.flush();
      // #endif
    })
  }
  VisitRectNode(rect_node: RectNode): void {
    TRACE_EVENT0('cobalt::renderer', 'Visit(RectNode)');
    this.withScaleAndTranslate(() => {

      let content_rect = rect_node.data().rect.CLONE();
      let border = rect_node.data().border;
      if (border) {
        content_rect.Inset(
          border.left.width,
          border.top.width,
          border.right.width,
          border.bottom.width);
      }

      // Apply rounded corners if it exists.
      let inner_rounded_corners: RoundedCorners;
      let rounded_corners = rect_node.data().rounded_corners;
      if (rounded_corners) {
        let border = rect_node.data().border;
        if (border) {
          inner_rounded_corners = rounded_corners.Inset(
            border.left.width,
            border.top.width,
            border.right.width,
            border.bottom.width);
        } else {
          inner_rounded_corners = rounded_corners;
        }
      }

      let background_brush = rect_node.data().background_brush;
      if (background_brush) {
        if (inner_rounded_corners! && !inner_rounded_corners.AreSquares()) {
          NOTIMPLEMENTED();
          // this.DrawRoundedRectWithBrush(
          //   background_brush,
          //   content_rect,
          //   inner_rounded_corners);
        } else {
          this.DrawRectWithBrush(background_brush, content_rect);
        }
      }

      if (rect_node.data().border) {
        NOTIMPLEMENTED;
        // if (rect_node.data().rounded_corners) {
        //   DrawSolidRoundedRectBorder(
        //   draw_state_, rect, rect_node.data().rounded_corners, content_rect,
        // inner_rounded_corners, rect_node.data().border);
        // } else {
        //   DrawSolidNonRoundRectBorder(draw_state_, rect,
        // rect_node.data().border);
        // }
      }

      // #if ENABLE_FLUSH_AFTER_EVERY_NODE
      // draw_state_.render_target.flush();
      // #endif
    })
  }
  VisitTextNode(text_node: TextNode): void {
    TRACE_EVENT0('cobalt::renderer', 'Visit(TextNode)');
    this.withScaleAndTranslate(() => {
      const { draw_state_ } = this;
      DCHECK_EQ(1.0, draw_state_.opacity);

      // If blur was used for any of the shadows, apply a little bit of blur
      // to all of them, to ensure that Skia follows the same path for rendering
      // them all (i.e. we don't want the main text to use distance field rendering
      // and the other text use standard bitmap font rendering), which ensures that
      // they will be pixel-aligned with each other.
      let blur_zero_sigma = 0.0;

      if (text_node.data().shadows) {
        let shadows: Shadow[] = text_node.data().shadows;

        for (let i = 0; i < shadows.length; ++i) {
          if (shadows[i].blur_sigma > 0.0) {
            // At least one shadow is using a blur, so set a small blur on all
            // text renders.
            blur_zero_sigma = 0.000001;
            break;
          }
        }

        let num_shadows = shadows.length;
        for (let i = num_shadows - 1; i >= 0; --i) {
          NOTREACHED();
          // Shadows are rendered in back to front order.
          let shadow = shadows[i];

          this.RenderText(
            text_node.data().glyph_buffer as GlyphBuffer,
            shadow.color,
            PointAtOffsetFromOrigin(text_node.data().offset.Add(shadow.offset)),
            shadow.blur_sigma == 0.0 ? blur_zero_sigma : shadow.blur_sigma);
        }
      }

      // Finally render the main text.
      let offset = text_node.data().offset.CLONE();
      this.RenderText(
        text_node.data().glyph_buffer as GlyphBuffer,
        text_node.data().color,
        PointAtOffsetFromOrigin(offset),
        blur_zero_sigma);
    })
  }
  VisitImageNode(image_node: ImageNode): void {
    // The image_node may contain nothing. For example, when it represents a video
    // element before any frame is decoded.
    if (!image_node.data().source) {
      return;
    }

    TRACE_EVENT0('cobalt::renderer', 'Visit(ImageNode)');
    let image = image_node.data().source;

    // Creating an image via a resource provider may simply return a frontend
    // image object and enqueue the initialization of a backend image (to be
    // performed on the rasterizer thread).  This function ensures that that
    // initialization is completed.  This would normally not be an issue if
    // an image is submitted as part of a render tree submission, however we
    // may end up with a non-backend-initialized image if a new image is selected
    // during an animation callback (e.g. video playback can do this).
    // This should be a quick operation, and it needs to happen eventually, so
    // if it is not done now, it will be done in the next frame, or the one after
    // that.
    if (image.EnsureInitialized()) {
      // EnsureInitialized() may make a number of GL calls that results in GL
      // state being modified behind Skia's back, therefore we have Skia reset its
      // state in this case.
      if (isFunction(this.reset_skia_context_function_)) {
        this.reset_skia_context_function_();
      }
    }

    // We issue different skia rasterization commands to render the image
    // depending on whether it's single or multi planned.
    let local_transform = image_node.data().local_transform.CLONE();
    local_transform.MUL(new PointF(devicePixelRatio, devicePixelRatio));

    let fallback_image: BaseImage;
    if (!image.CanRenderInSkia() &&
      !IsOnlyScaleAndTranslate(local_transform)) {
      NOTIMPLEMENTED();
      // // For anything beyond simply scale and translate.  Convert the image to
      // // single plane image and use the skia pipeline.
      // fallback_image = this.convert_render_tree_to_image_function_(new ImageNode(image));
      // image = fallback_image as ImageParser;
      // DCHECK(image.CanRenderInSkia());
    }

    if (image.CanRenderInSkia()) {
      if (image.GetTypeId() === baseGetTypeId(SinglePlaneImage)) {
        let rect = image_node.data().destination_rect.CLONE();
        rect.Scale(devicePixelRatio);
        this.RenderSinglePlaneImage(image as SinglePlaneImage, this.draw_state_, rect, local_transform);
      } else if (image.GetTypeId() === baseGetTypeId(MultiPlaneImage)) {
        NOTIMPLEMENTED();
        // this.RenderMultiPlaneImage(image, this.draw_state_, image_node.data().destination_rect, local_transform);
      } else {
        NOTREACHED();
      }
    } else {
      NOTIMPLEMENTED();
      // this.render_image_fallback_function_(image_node, this.draw_state_);
    }

    // #if ENABLE_FLUSH_AFTER_EVERY_NODE
    // draw_state_.render_target.flush();
    // #endif
  }
  VisitFreehandNode(node: FreehandNode) {
    TRACE_EVENT0('cobalt::renderer', 'Visit(ImageNode)');
    let data = node.data();
    this.withScaleAndTranslate(() => {
      this.RenderPath(
        data.d,
        data.fill,
        data.stroke,
      )
    })
  }

  private withScaleAndTranslate(cb: () => void) {
    this.draw_state_.render_target.save();
    this.draw_state_.render_target.scale(devicePixelRatio, devicePixelRatio);
    cb()
    this.draw_state_.render_target.restore();
  }

  private RenderSinglePlaneImage(
    single_plane_image: SinglePlaneImage,
    draw_state: RenderTreeNodeVisitorDrawState,
    destination_rect: RectF,
    local_transform: Matrix3F) {
    // DCHECK(!single_plane_image.GetContentRegion());
    this.CreateSkPaintForImageRendering(draw_state, single_plane_image.IsOpaque(), (paint) => {
      // In the most frequent by far case where the normalized transformed image
      // texture coordinates lie within the unit square, then we must ensure NOT
      // to interpolate texel values with wrapped texels across the image borders.
      // This can result in strips of incorrect colors around the edges of images.
      // Thus, if the normalized texture coordinates lie within the unit box, we
      // will blit the image using drawBitmapRectToRect() which handles the bleeding
      // edge problem for us.

      // Determine the source rectangle, in image texture pixel coordinates.
      let img_size = single_plane_image.GetSize();
      let image = single_plane_image.GetImage();
      if (IsScaleAndTranslateOnly(local_transform) &&
        LocalCoordsStaysWithinUnitBox(local_transform)) {
        let width = img_size.width() / local_transform.Get(0, 0);
        let height = img_size.height() / local_transform.Get(1, 1);
        let x = -width * local_transform.Get(0, 2);
        let y = -height * local_transform.Get(1, 2);

        if (image) {
          let src = SkRect_MakeXYWH(x, y, width, height);
          draw_state.render_target.drawImageRect(
            image, src, CobaltRectFToSkiaRect(destination_rect), paint);
        }
      } else {
        NOTIMPLEMENTED();
        // // Use the more general approach which allows arbitrary local texture
        // // coordinate matrices.
        // let skia_local_transform = CobaltMatrixToSkia(local_transform);
        //
        // ConvertLocalTransformMatrixToSkiaShaderFormat(img_size, destination_rect,
        //   skia_local_transform);
        //
        // if (image) {
        //   let image_shader = image.makeShader(
        //     SkTileMode.kRepeat, SkTileMode.kRepeat, skia_local_transform);
        //
        //   paint.setShader(image_shader);
        //
        //   draw_state.render_target.drawRect(
        //     CobaltRectFToSkiaRect(destination_rect), paint);
        // }
      }
    })
  }

  private CreateSkPaintForImageRendering<R>(
    draw_state: RenderTreeNodeVisitorDrawState,
    is_opaque: boolean,
    cb: AccessorCallback<Paint, R>
  ): R {
    return makePaint((paint) => {
      // |kLow_SkFilterQuality| is used for bilinear interpolation of images.
      // paint.setFilterQuality(kLow_SkFilterQuality);

      if (!IsOpaque(draw_state.opacity)) {
        paint.setAlphaf(draw_state.opacity * 255);
      } else if (is_opaque && draw_state.clip_is_rect) {
        paint.setBlendMode(CanvasKit.BlendMode.Src);
      }
      try {
        return cb(paint);
      } finally {
        paint.deleteLater();
      }
    })
  }

  private DrawClearRect(rect: RectF, color: ColorRGBA) {
    let sk_rect = SkRect_MakeXYWH(rect.x(), rect.y(), rect.width(), rect.height());

    makePaint((paint) => {
      paint.setBlendMode(CanvasKit.BlendMode.Src);
      paint.setColorComponents(color.r() * 255, color.g() * 255,
        color.b() * 255, color.a() * 255);

      this.draw_state_.render_target.drawRect(sk_rect, paint);
    })
  }

  private DrawRoundedRectWithBrush(brush: Brush,
                                   rect: RectF,
                                   rounded_corners: RoundedCorners) {
    NOTIMPLEMENTED;
    // if (!CheckForSolidBrush(brush)) {
    //   NOTREACHED('Only solid brushes are currently supported for this shape ');
    //   return;
    // }
    //
    // let paint = new this.CanvasKit.Paint;
    // let brush_visitor = new SkiaBrushVisitor(paint, this.draw_state_);
    // brush.Accept(brush_visitor);
    //
    // paint.setAntiAlias(true);
    // this.draw_state_.render_target.drawPath(
    //   RoundedRectToSkiaPath(rect, rounded_corners), paint);
  }

  private DrawRectWithBrush(
    brush: Brush,
    rect: RectF) {
    // Setup our paint object according to the brush parameters set on the
    // rectangle.
    let { draw_state_ } = this;
    makePaint(paint => {
      let brush_visitor = new SkiaBrushVisitor(paint, draw_state_);
      brush.Accept(brush_visitor);

      // FIXME
      // if (!draw_state_.render_target.getTotalMatrix().preservesAxisAlignment()) {
      //   // Enable anti-aliasing if we're rendering a rotated or skewed box.
      //   paint.setAntiAlias(true);
      // }

      draw_state_.render_target.drawRect(
        SkRect_MakeXYWH(rect.x(), rect.y(), rect.width(), rect.height()), paint);
    })
  }

  private RenderText(
    glyph_buffer: GlyphBuffer,
    color: ColorRGBA,
    position: PointF,
    blur_sigma: number) {
    TRACE_EVENT0('cobalt::renderer', 'RenderText()');
    if (blur_sigma > 20.0) {
      // TODO: We could easily switch to using a blur filter at this point.
      //       Ideally we would just use a blur filter to do all blurred text
      //       rendering. Unfortunately, performance is currently terrible when
      //       using blur filters. Since we don't use blur filters (instead the
      //       blur is rasterized into the glyph atlas by software), we choose not
      //       to snap to using them when the blur reaches a certain point to
      //       avoid discontinuity in blur appearance and performance issues.
      NOTIMPLEMENTED('Cobalt does not yet support text blurs with Gaussian ', 'sigmas larger than 20.');
    } else {
      let text_blob = glyph_buffer.GetTextBlob();
      if (!text_blob) {
        return;
      }
      makePaint((paint) => {
        paint.setAntiAlias(true);
        paint.setColorComponents(color.r() * 255, color.g() * 255,
          color.b() * 255, color.a() * 255,);

        if (blur_sigma > 0.0) {
          NOTIMPLEMENTED();
          // sk_sp<SkMaskFilter> mf(
          //   SkMaskFilter::MakeBlur(kNormal_SkBlurStyle, blur_sigma));
          // paint.setFilterQuality(SkFilterQuality::kHigh_SkFilterQuality);
          // paint.setMaskFilter(mf);
        }
        if (!text_blob) {
          return;
        }
        this.draw_state_.render_target.drawTextBlob(text_blob, position.x(), position.y(), paint);
      })
    }
  }

  private RenderPath(
    d: string,
    fill: Optional<ColorRGBA>,
    stroke: Optional<ColorRGBA>,
  ) {
    makePaint(paint => {
      paint.setAntiAlias(true);
      return MakePathFromSVGString(d)(
        (path) => {
          if (!path) {
            NOTREACHED()
          }
          if (fill) {
            paint.setStyle(CanvasKit.PaintStyle.Fill)
            paint.setColorComponents(
              fill.r() * 255,
              fill.g() * 255,
              fill.b() * 255,
              fill.a() * 255,
            );
            this.draw_state_.render_target.drawPath(path, paint);
          }
          if (stroke) {
            paint.setStyle(CanvasKit.PaintStyle.Stroke)
            paint.setColorComponents(
              stroke.r() * 255,
              stroke.g() * 255,
              stroke.b() * 255,
              stroke.a() * 255,
            )
            this.draw_state_.render_target.drawPath(path, paint);
          }
        }
      )
    })
  }
}

function NodeIsWithinCanvasBounds(total_matrix: SkMatrix,
                                  canvas_bounds: SkRect,
                                  node: Node): boolean {
  // FIXME
  return true;
  // SkRect sk_child_bounds(CobaltRectFToSkiaRect(node.GetBounds()));
  // SkRect sk_child_bounds_absolute;
  //
  // // Use the total matrix to compute the node's bounding rectangle in the
  // // canvas' coordinates.
  // total_matrix.mapRect(&sk_child_bounds_absolute, sk_child_bounds);
  //
  // // Return if the node's bounding rectangle intersects with the canvas'
  // // bounding rectangle.
  // return sk_child_bounds_absolute.intersect(canvas_bounds);
}

class SkiaBrushVisitor extends BrushVisitor {

  private paint_: Paint;
  private draw_state_: RenderTreeNodeVisitorDrawState;
  constructor(
    paint: Paint,
    draw_state: RenderTreeNodeVisitorDrawState,
  ) {
    super();
    this.paint_ = paint;
    this.draw_state_ = draw_state;
  }
  visitLinearGradientBrush(linear_gradient_brush: LinearGradientBrush): void {
    let points: [SkPoint, SkPoint] = [
      [linear_gradient_brush.source().x(), linear_gradient_brush.source().y()],
      [linear_gradient_brush.dest().x(), linear_gradient_brush.dest().y()]
    ];

    let skia_color_stops = new SkiaColorStops(linear_gradient_brush.color_stops());

    let shader = CanvasKit.Shader.MakeLinearGradient(
      points[0],
      points[1],
      new Float32Array(skia_color_stops.colors[0]),
      skia_color_stops.positions,
      CanvasKit.TileMode.Clamp,
      undefined,
      SkGradientShader.Flags.kInterpolateColorsInPremul_Flag);
    this.paint_.setShader(shader);

    if (!skia_color_stops.has_alpha && IsOpaque(this.draw_state_.opacity)) {
      this.paint_.setBlendMode(CanvasKit.BlendMode.Src);
    } else {
      if (!IsOpaque(this.draw_state_.opacity)) {
        this.paint_.setAlphaf(255 * this.draw_state_.opacity);
      }
      this.paint_.setBlendMode(CanvasKit.BlendMode.SrcOver);
    }
  }
  visitRadialGradientBrush(radial_gradient_brush: RadialGradientBrush): void {
    NOTIMPLEMENTED();
  }
  visitSolidColorBrush(solid_color_brush: SolidColorBrush): void {
    let color = solid_color_brush.color();

    let alpha = color.a() * this.draw_state_.opacity;
    if (IsOpaque(alpha)) {
      this.paint_.setBlendMode(CanvasKit.BlendMode.Src);
    } else {
      this.paint_.setBlendMode(CanvasKit.BlendMode.SrcOver);
    }

    this.paint_.setColorComponents(color.r() * 255, color.g() * 255,
      color.b() * 255, alpha * 255);
  }
};

// Helper struct to convert render_tree::ColorStopList to a format that Skia
// methods will easily accept.
class SkiaColorStops {
  colors: SkColor[] = [];
  positions: SkScalar[] = [];
  has_alpha: boolean;

  constructor(
    color_stops: ColorStopList
  ) {
    this.has_alpha = false;
    this.colors = new Array(color_stops.length);
    this.positions = new Array(color_stops.length);
    for (let i = 0; i < color_stops.length; ++i) {
      if (color_stops[i].color.HasAlpha()) {
        this.has_alpha = true;
      }

      this.colors[i] = ToSkColor(color_stops[i].color);
      this.positions[i] = color_stops[i].position;
    }
  }
};

function ToSkColor(color: ColorRGBA): SkColor {
  return [color.r(), color.g(), color.b(), color.a()];
}

function IsScaleAndTranslateOnly(mat: Matrix3F) {
  return mat.Get(0, 1) == 0.0 && mat.Get(1, 0) == 0.0;
}

function LocalCoordsStaysWithinUnitBox(mat: Matrix3F): boolean {
  return mat.Get(0, 2) <= 0.0 && 1.0 - mat.Get(0, 2) <= mat.Get(0, 0) &&
    mat.Get(1, 2) <= 0.0 && 1.0 - mat.Get(1, 2) <= mat.Get(1, 1);
}
