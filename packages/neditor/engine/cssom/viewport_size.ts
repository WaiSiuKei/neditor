import { Size } from '../math/size';

export class ViewportSize {
  width_height_: Size;
  // Size of the diagonal between two opposing screen corners in inches.
  // A value of 0 means the size of the display is not known.
  diagonal_inches_ = 0;
  // Ratio of CSS pixels per device pixel, matching the devicePixelRatio
  // attribute.
  //   https://www.w3.org/TR/2016/WD-cssom-view-1-20160317/#dom-window-devicepixelratio
  device_pixel_ratio_ = 1.0;

  constructor()
  constructor(other: ViewportSize)
  constructor(w: number, h: number)
  constructor(w: number, h: number, diagonal_inches: number, device_pixel_ratio: number)
  constructor(...args: unknown[]) {
    if (!args.length) {
      this.width_height_ = new Size(0, 0);
    } else if (args.length === 1) {
      let other = args[0] as ViewportSize;
      this.width_height_ = new Size();
    } else if (args.length === 2) {
      let w = args[0] as number;
      let h = args[1] as number;
      this.width_height_ = new Size(w, h);

    } else if (args.length === 4) {
      let w = args[0] as number;
      let h = args[1] as number;
      let diagonal_inches = args[2] as number;
      let device_pixel_ratio = args[3] as number;
      this.width_height_ = new Size(w, h);
      this.diagonal_inches_ = diagonal_inches;
      this.device_pixel_ratio_ = device_pixel_ratio;

    } else {
      throw new Error('500');
    }

  }
  width_height(): Size { return this.width_height_; }
}
