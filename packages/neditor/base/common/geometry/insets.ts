export class Insets {
  left_: number;
  top_: number;
  right_: number;
  bottom_: number;

  constructor(left: number = 0,
              top: number = 0,
              right: number = 0,
              bottom: number = 0) {
    this.left_ = left;
    this.top_ = top;
    this.right_ = right;
    this.bottom_ = bottom;
  }

  get left() { return this.left_; }
  set left(left: number) { this.left_ = left; }

  get top() { return this.top_; }
  set top(top: number) {this.top_ = top; }

  get right() { return this.right_; }
  set right(right: number) { this.right_ = right; }

  get bottom() { return this.bottom_; }
  set bottom(bottom: number) { this.bottom_ = bottom; }

  // SetInsets(left: number,
  //           top: number,
  //           right: number,
  //           bottom: number) {
  //   this.left_ = left;
  //   this.top_ = top;
  //   this.right_ = right;
  //   this.bottom_ = bottom;
  // }

  zero(): boolean {
    return this.left_ == 0 && this.top_ == 0 && this.right_ == 0 &&
      this.bottom_ == 0;
  }

  EQ(insets: Insets): boolean {
    return this.left_ == insets.left_ && this.top_ == insets.top_ &&
      this.right_ == insets.right_ && this.bottom_ == insets.bottom_;
  }

  NE(insets: Insets): boolean {
    return !this.EQ(insets);
  }

  ADD_ASSIGN(insets: Insets) {
    this.left_ += insets.left_;
    this.top_ += insets.top_;
    this.right_ += insets.right_;
    this.bottom_ += insets.bottom_;
  }

  NEG() {
    return new Insets(-this.left_, -this.top_, -this.right_, -this.bottom_);
  }
}
