import { Disposable } from '@neditor/core/base/common/lifecycle';
import { devicePixelRatio } from '@neditor/core/base/browser/devicePixelRatio';
import { toPX } from '@neditor/core/base/browser/css';
import { RenderTarget } from '@neditor/core/engine/renderer/backend/render_target';
import { SkResourceProvider } from '@neditor/core/engine/renderer/rasterizer/sk_resource_provider';
import { Matrix } from '@neditor/core/base/common/geometry';
import {
  ICanvasViewModel,
} from '../../../viewModel/viewModel';
import { ICanvasView } from '../../view';
import { mountAPP } from './app';
import { Emitter } from '../../../../base/common/event';
import { WebModule } from '../../../../engine/browser/web_module';
import { RendererModule } from '../../../../engine/renderer/renderer_module';
import { Layer, RenderTreeCombiner } from '../../../../engine/browser/render_tree_combiner';
import { ViewportSize } from '../../../../engine/cssom/viewport_size';
import { LayoutResults } from '../../../../engine/layout/layout_manager';
import { TRACE_EVENT0 } from '../../../../base/trace_event/common/trace_event_common';
import { Submission } from '../../../../engine/renderer/submission';
import { DCHECK } from '../../../../base/check';

const kMainWebModuleZIndex = 1;

export class Canvas extends Disposable {
  private _onMounted = new Emitter<void>();
  get onMounted() {
    return this._onMounted.event;
  }

  private _resource_provider: SkResourceProvider;
  private web_module_: WebModule;
  private renderer_module_: RendererModule;
  private current_main_web_module_timeline_id_ = 0;

  // Manages the three render trees, combines and renders them.
  private render_tree_combiner_ = new RenderTreeCombiner;
  private main_web_module_layer_: Layer;

  constructor(
    private container: HTMLElement,
    private view: ICanvasView,
    private vm: ICanvasViewModel,
  ) {
    super();
    let canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.container.appendChild(canvas);
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    Object.assign(canvas.style, {
      width: toPX(innerWidth),
      height: toPX(innerHeight),
    });
    let render_target = new RenderTarget(canvas);
    let resource_provider = new SkResourceProvider();
    this._resource_provider = resource_provider;

    let viewport_size = this.GetViewportSize();

    this.web_module_ = new WebModule(
      this.QueueOnRenderTreeProduced.bind(this),
      viewport_size,
      resource_provider,
      {
        name: 'MainWebModule',
        clear_window_with_background_color: true,
      }
    );
    this.renderer_module_ = new RendererModule({
      render_target,
      resource_provider,
      transformAccessor: () => {
        return this.view.mx;
      }
    });

    // Create the main web module layer.
    this.main_web_module_layer_ = this.render_tree_combiner_.CreateLayer(kMainWebModuleZIndex)!;

    this.init();

    this._register(view.onCameraChagned(() => {
      this.SubmitCurrentRenderTreeToRenderer();
    }));
  }

  get layoutManager() {
    return this.web_module_.layoutManager;
  }

  get document() {
    return this.web_module_.document;
  }

  GetViewportSize() {
    return new ViewportSize(1280, 720);
  }

  private QueueOnRenderTreeProduced(layout_results: LayoutResults) {
    TRACE_EVENT0('cobalt::browser', 'BrowserModule::QueueOnRenderTreeProduced()');
    this.OnRenderTreeProduced(layout_results);
    this.ProcessRenderTreeSubmissionQueue();
  }

  private OnRenderTreeProduced(
    layout_results: LayoutResults) {
    TRACE_EVENT0('cobalt::browser', 'BrowserModule::OnRenderTreeProduced()');

    // if (application_state_ == base::kApplicationStateConcealed) {
    //   layout_results.on_rasterized_callback.Run();
    //   return;
    // }

    let renderer_submission = CreateSubmissionFromLayoutResults(layout_results);

    // Set the timeline id for the main web module.  The main web module is
    // assumed to be an interactive experience for which the default timeline
    // configuration is already designed for, so we don't configure anything
    // explicitly.
    renderer_submission.timeline_info.id = this.current_main_web_module_timeline_id_;

    this.render_tree_combiner_.SetTimelineLayer(this.main_web_module_layer_);
    this.main_web_module_layer_.Submit(renderer_submission);

    this.SubmitCurrentRenderTreeToRenderer();
  }

  private ProcessRenderTreeSubmissionQueue() {
    TRACE_EVENT0('cobalt::browser',
      'BrowserModule::ProcessRenderTreeSubmissionQueue()');
    // If the app is preloaded, clear the render tree queue to avoid unnecessary
    // rendering overhead.
    // if (application_state_ == base::kApplicationStateConcealed) {
    //   render_tree_submission_queue_.ClearAll();
    // } else {
    //   render_tree_submission_queue_.ProcessAll();
    // }
  }

  public SubmitCurrentRenderTreeToRenderer() {
    let submission = this.render_tree_combiner_.GetCurrentSubmission();
    if (submission) {
      this.renderer_module_.pipeline().Submit(submission);
    }
  }

  async init() {
    await this._resource_provider.fontReady.wait();
    this.SetApplicationStartOrPreloadTimestamp(false /*is_preload*/, Date.now());
    this.SubmitCurrentRenderTreeToRenderer();
    let doc = this.document;
    doc.onCreated(() => {
      let html = doc.createElement('html');
      Object.assign(html.style, {
        display: 'block',
        position: 'relative'
      } as CSSStyleDeclaration);
      doc.appendChild(html);
      this._register(mountAPP(this.vm, doc));
    });
    this._onMounted.fire();
  }

  // Pass the application preload or start timestamps from Starboard.
  SetApplicationStartOrPreloadTimestamp(is_preload: boolean, timestamp: number) {
    DCHECK(this.web_module_);
    this.web_module_.SetApplicationStartOrPreloadTimestamp(is_preload, timestamp);
  }
}

function CreateSubmissionFromLayoutResults(layout_results: LayoutResults): Submission {
  let renderer_submission = new Submission(layout_results.render_tree, layout_results.layout_time);
  if (!!layout_results.on_rasterized_callback) {
    renderer_submission.on_rasterized_callbacks.push(layout_results.on_rasterized_callback);
  }
  return renderer_submission;
}
