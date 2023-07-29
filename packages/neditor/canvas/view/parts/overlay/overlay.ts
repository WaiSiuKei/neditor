import { toPX } from '../../../../base/browser/css';
import { devicePixelRatio } from '../../../../base/browser/devicePixelRatio';
import { Disposable } from '../../../../base/common/lifecycle';
import { ICanvasState } from '../../../canvas/canvas';
import { renderElementsBoxHighlight } from './renderer';

export class Overlay extends Disposable {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  constructor(
    private container: HTMLElement,
  ) {
    super();
    let canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.canvas = canvas;
    this.container.appendChild(canvas);
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    Object.assign(canvas.style, {
      width: toPX(innerWidth),
      height: toPX(innerHeight),
      position: 'absolute',
    } as CSSStyleDeclaration);
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  reflow(appState: ICanvasState) {
    const scale = window.devicePixelRatio;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.save();
    this.ctx.scale(scale, scale);
    const normalizedCanvasWidth = this.canvas.width / scale;
    const normalizedCanvasHeight = this.canvas.height / scale;
    this.ctx.clearRect(0, 0, normalizedCanvasWidth, normalizedCanvasHeight);
    renderElementsBoxHighlight(
      this.ctx,
      appState,
      appState.selectedElements,
    );
  }
}
