import { Canvas } from 'canvaskit-wasm';

export class RenderTreeNodeVisitorDrawState {
  render_target: Canvas;
  opacity: number = 1;
  // True if the current clip is a rectangle or not.  If it is not, we need
  // to enable blending when rendering clipped rectangles.
  clip_is_rect = true;
  constructor(render_target: Canvas) {
    this.render_target = render_target;
  }

  // glm::mat4 transform_3d;
  // transform_3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) {}

};
