export class Size {
  width_: number = 0;
  height_: number = 0;

  constructor()
  constructor(p: Size)
  constructor(x: number,
              y: number)
  constructor(arg1?: unknown,
              arg2?: unknown) {
    if (arguments.length == 1) {
      let arg = arg1 as Size;
      this.width_ = arg.width_;
      this.height_ = arg.height_;
    } else if (arguments.length === 2) {
      this.width_ = arg1 as number;
      this.height_ = arg2 as number;
    }
  }

  isEmpty(): boolean {
    return (this.width_ == 0) || (this.height_ == (0));
  }
  get width() {
    return this.width_;
  }
  get height() {
    return this.height_;
  }

  set width(width: number) {
    this.width_ = width;
  }
  set height(height: number) {
    this.height_ = height;
  }

  // SetSize(width: number, height: number) {
  //   this.set_width(width);
  //   this.set_height(height);
  // }

  get area() {
    return this.width * this.height;
  }

  Enlarge(width: number,
          height: number) {
    this.width = this.width_ + width;
    this.height = this.height_ + height;
  }
  SetToMin(other: Size) {
    this.width_ = this.width_ <= other.width_ ? this.width_ : other.width_;
    this.height_ = this.height_ <= other.height_ ? this.height_ : other.height_;
  }

  SetToMax(other: Size) {
    this.width_ = this.width_ >= other.width_ ? this.width_ : other.width_;
    this.height_ = this.height_ >= other.height_ ? this.height_ : other.height_;
  }

  CLONE() {
    return new Size(this);
  }

  scale(scale: number) {
    this.width_ *= scale;
    this.height_ *= scale;
  }

  toString() {
    return `${this.width}x${this.height}`;
  }
}
