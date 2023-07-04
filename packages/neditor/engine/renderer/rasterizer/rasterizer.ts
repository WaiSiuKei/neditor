import { Optional } from '@neditor/core/base/common/typescript';
import { Rect } from '../../math/rect';
import { ResourceProvider } from '../../render_tree/resource_provider';
import { Node } from '../../render_tree/node';
import { Surface } from 'canvaskit-wasm';

export class RasterizerOptions {
  // A bitwise combination of any of the |kSubmitFlags_*| constants defined
  // above.
  flags = 0;

  // If specified, indicates which region of |render_target| is
  // dirty and needs to be updated.  If animations are playing for example,
  // then |dirty| can be setup to bound the animations.  A rasterizer is free
  // to ignore this value if they wish.
  dirty: Optional<Rect>;
};

// This class abstracts the concept of an actor that consumes render trees
// and produces graphics on a given render target.  A rasterizer
// would typically be setup with a render target that ultimately the submitted
// render tree would be rasterized to.  Having this as an abstract class
// allows for flexibility in its implementation, for example we may provide
// a software rasterizer that simply blits the output to a render target
// after it is done being rasterized.  Alternatively, a hardware implementation
// may be implemented so that render tree rasterization is performed on the GPU.
// The rasterizer leaves the above choices to the implementation, as well
// as choices like which rendering library to use (e.g. Skia).  Of course,
// resources such as Images and Fonts that are referenced by the render tree
// must be in a format supported by the rasterizer, and this is enabled by
// having the Rasterizer return a specialized ResourceProvider.
export abstract class Rasterizer {

  // When set, will clear the render target before rasterizing the render tree
  // to it.
  static kSubmitFlags_Clear = (1 << 0);

  // Consumes the render tree and rasterizes it to the specified render_target.
  // |options| must be a combination of the |kSubmitOptions_*| constants defined
  // above.
  abstract Submit(render_tree: Node,
                  render_target: Surface,
                  options?: RasterizerOptions): void

  // Returns a thread-safe object from which one can produce renderer resources
  // like images and fonts which can be referenced by render trees that are
  // subsequently submitted to this pipeline.  This call must be thread-safe.
  abstract GetResourceProvider(): ResourceProvider

  // For GL-based rasterizers, some animation updates can require that the
  // rasterizer's GL context be current when they are executed.  This method
  // is essentially a hack to allow GL-based rasterizers a chance to set their
  // context current before we move to update animations.
  // virtual void MakeCurrent() = 0;
  // virtual void ReleaseContext() = 0;
};
