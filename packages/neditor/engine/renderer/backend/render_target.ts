import { Size } from '../../math/size';
import { Surface } from 'canvaskit-wasm';
import {CanvasKit} from '@neditor/skia'

export class RenderTarget {
  private size_: Size;
  private surface_?: Surface;

  constructor(
    canvas: HTMLCanvasElement,
  ) {
    this.size_ = new Size(canvas.width, canvas.height);
    this.surface_ = CanvasKit.MakeCanvasSurface(canvas)!;
  }

  get surface() {
    return this.surface_!;
  }

  GetSize() {
    return this.size_;
  }
}

