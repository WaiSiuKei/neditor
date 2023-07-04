export class SizeBase {
  width_: number = 0;
  height_: number = 0;

  constructor()
  constructor(p: SizeBase)
  constructor(x: number, y: number)
  constructor(arg1?: unknown, arg2?: unknown) {
    if (arguments.length == 1) {
      let arg = arg1 as SizeBase;
      this.width_ = arg.width_;
      this.height_ = arg.height_;
    } else if (arguments.length === 2) {
      this.width_ = arg1 as number;
      this.height_ = arg2 as number;
    }
  }

  IsEmpty(): boolean {
    return (this.width_ == 0) || (this.height_ == (0));
  }
  width() {
    return this.width_;
  }
  height() {
    return this.height_;
  }

  set_width(width: number) {
    this.width_ = width;
  }
  set_height(height: number) {
    this.height_ = height;
  }

  // SetSize(width: number, height: number) {
  //   this.set_width(width);
  //   this.set_height(height);
  // }

  GetArea() {
    return this.width() * this.height();
  }

  Enlarge(width: number, height: number) {
    this.set_width(this.width_ + width);
    this.set_height(this.height_ + height);
  }
  SetToMin(other: SizeBase) {
    this.width_ = this.width_ <= other.width_ ? this.width_ : other.width_;
    this.height_ = this.height_ <= other.height_ ? this.height_ : other.height_;
  }

  SetToMax(other: SizeBase) {
    this.width_ = this.width_ >= other.width_ ? this.width_ : other.width_;
    this.height_ = this.height_ >= other.height_ ? this.height_ : other.height_;
  }

  CLONE() {
    return new SizeBase(this);
  }

  Scale(scale: number) {
    this.width_ *= scale;
    this.height_ *= scale;
  }
}

export class Size extends SizeBase {
  GetArea(): number {
    return this.width() * this.height();
  }

  ToString() {
    return `${this.width()}x${this.height()}`;
  }
}
