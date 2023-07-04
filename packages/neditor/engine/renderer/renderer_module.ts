import { Pipeline } from './pipeline';
import { ResourceProvider } from '../render_tree/resource_provider';
import { Optional } from '@neditor/core/base/common/typescript';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { RenderTarget } from './backend/render_target';
import { HardwareRasterizer } from './rasterizer/hardware_rasterizer';
import { IMatrix } from "@neditor/core/base/common/geometry";

export interface RendererModuleOptions {
  // enable_fps_stdout: boolean
  // enable_fps_overlay : boolean
  render_target: RenderTarget;
  resource_provider: ResourceProvider;
  transformAccessor: () => IMatrix;
};

export class RendererModule {
  private pipeline_: Pipeline;
  constructor(
    options: RendererModuleOptions
  ) {
    const { render_target, resource_provider, transformAccessor } = options;
    const { surface } = render_target;

    {
      TRACE_EVENT0('cobalt::renderer', 'new renderer::Pipeline()');

      this.pipeline_ = new Pipeline(
        new HardwareRasterizer(resource_provider, transformAccessor),
        surface,
        false,
      );
    }
  }

  pipeline(): Pipeline { return this.pipeline_; }

  resource_provider(): Optional<ResourceProvider> {
    if (!this.pipeline_) {
      return undefined;
    }

    return this.pipeline_.GetResourceProvider();
  }

  // math::Size render_target_size() { return render_target()->GetSize(); }
};
