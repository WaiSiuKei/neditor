// This HardwareRasterizer class represents a rasterizer that will setup
// a Skia hardware rendering context.  When Submit() is called, the passed in
// render tree will be rasterized using hardware-accelerated Skia.  The
// HardwareRasterizer must be constructed on the same thread that Submit()
// is to be called on.
import { Rasterizer, RasterizerOptions } from './rasterizer';
import { getFunctionName, TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Node } from '../../render_tree/node';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { Canvas, Surface } from 'canvaskit-wasm';
import { DCHECK } from '@neditor/core/base/check';
import { CreateScratchSurfaceFunction, RenderTreeNodeVisitor, ScratchSurface } from './render_tree_node_visitor';
import { Image } from '../../render_tree/image';
import { IMatrix } from "@neditor/core/base/common/geometry";

export class HardwareRasterizer extends Rasterizer {
  constructor(
    private resource_provider_: ResourceProvider,
    private transformAccessor_: () => IMatrix,
  ) {
    super();
    TRACE_EVENT0('cobalt::renderer', getFunctionName(HardwareRasterizer, HardwareRasterizer.prototype.constructor));
  }
  // The passed in render target will be used to determine the dimensions of
  // the output.  The graphics context will be used to issue commands to the GPU
  // to blit the final output to the render target.
  // The value of |skia_cache_size_in_bytes| dictates the maximum amount of
  // memory that Skia will use to cache the results of certain effects that take
  // a long time to render, such as shadows.  The results will be reused across
  // submissions.
  // The value of |scratch_surface_cache_size_in_bytes| sets an upper limit on
  // the number of bytes that can be consumed by the scratch surface cache,
  // a facility that allows temporary surfaces to be reused within the
  // rasterization of a single frame/submission.
  // If |surface_cache_size| is non-zero, the rasterizer will set itself up with
  // a surface cache such that expensive render tree nodes seen multiple times
  // will get saved to offscreen surfaces.

  // Consume the render tree and output the results to the render target passed
  // into the constructor.

  // void Submit(const scoped_refptr<render_tree::Node>& render_tree,
  //             const scoped_refptr<backend::RenderTarget>& render_target,
  //             const Options& options) override;

  // Consume the render tree and output the results to the specified canvas.
  // void SubmitOffscreen(const scoped_refptr<render_tree::Node>& render_tree,
  //                      SkCanvas* canvas);

  // Get the cached canvas for a render target that would normally go through
  // Submit(). The cache size is limited, so this should not be used for
  // generic offscreen render targets.
  // SkCanvas* GetCachedCanvas(
  //     const scoped_refptr<backend::RenderTarget>& render_target);

  GetResourceProvider() {
    return this.resource_provider_;
  }

  Submit(render_tree: Node,
         render_target: Surface,
         options?: RasterizerOptions): void {
    // Get a SkCanvas that outputs to our hardware render target.
    let canvas = this.GetCanvasFromRenderTarget(render_target);


    const mx = this.transformAccessor_()
    const { tx, ty } = mx;
    canvas.save();

    if (options && options.flags & Rasterizer.kSubmitFlags_Clear) {
      canvas.clear([0, 0, 0, 0]);
    }

    canvas.translate(tx * devicePixelRatio, ty * devicePixelRatio)
    // Rasterize the passed in render tree to our hardware render target.
    this.RasterizeRenderTreeToCanvas(render_target, render_tree, canvas);

    {
      TRACE_EVENT0('cobalt::renderer', 'Skia Flush');
      render_target.flush();
    }

    canvas.restore();
  }

  GetCanvasFromRenderTarget(
    render_target: Surface): Canvas {
    return render_target.getCanvas();
  }

  RasterizeRenderTreeToCanvas(
    render_target: Surface,
    render_tree: Node,
    canvas: Canvas,
    /* GrSurfaceOrigin origin*/) {
    TRACE_EVENT0('cobalt::renderer', 'RasterizeRenderTreeToCanvas');
    // TODO: This trace uses the name in the current benchmark to keep it work as
    // expected. Remove after switching to webdriver benchmark.
    TRACE_EVENT0('cobalt::renderer', 'VisitRenderTree');

    let create_scratch_surface_function: CreateScratchSurfaceFunction = () => {
        TRACE_EVENT0('cobalt::renderer', 'HardwareRasterizer::CreateScratchImage()');

        return new class SimpleScratchSurface extends ScratchSurface {
          GetSurface(): Surface {
            return render_target;
          }
        };

      };
    let visitor = new RenderTreeNodeVisitor(
      canvas,
      create_scratch_surface_function,
      this.ResetSkiaState.bind(this),
      this.ConvertRenderTreeToImage.bind(this)
    );
    DCHECK(render_tree);
    render_tree.Accept(visitor);
  }

  ResetSkiaState() {
  }
  ConvertRenderTreeToImage(root: Node): Image {
    return this.resource_provider_.DrawOffscreenImage(root);
  }
}

