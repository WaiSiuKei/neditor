import { DCHECK } from '../../base/check';

export class DOMRectReadOnly {
  protected x_: number;
  protected y_: number;
  protected width_: number;
  protected height_: number;
  constructor(x: number, y: number, width: number, height: number) {
    DCHECK(width > 0);
    DCHECK(height > 0);
    this.x_ = x;
    this.y_ = y;
    this.width_ = width;
    this.height_ = height;
  }

  x() { return this.x_; }
  y() { return this.y_; }
  width() { return this.width_; }
  height() { return this.height_; }

  top() { return Math.min(this.y_, this.y_ + this.height_); }
  right() { return Math.max(this.x_, this.x_ + this.width_); }
  bottom() { return Math.max(this.y_, this.y_ + this.height_); }
  left() { return Math.min(this.x_, this.x_ + this.width_); }
}

