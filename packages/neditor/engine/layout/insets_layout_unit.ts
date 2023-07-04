// A floating-point version of Insets.
import { LayoutUnit } from './layout_unit';

export class InsetsLayoutUnit {
  left_: LayoutUnit;
  top_: LayoutUnit;
  right_: LayoutUnit;
  bottom_: LayoutUnit;

  constructor(left = new LayoutUnit, top = new LayoutUnit, right = new LayoutUnit, bottom = new LayoutUnit) {
    this.left_ = left;
    this.top_ = top;
    this.right_ = right;
    this.bottom_ = bottom;
  }

  left() { return this.left_; }
  set_left(left: LayoutUnit) { this.left_ = left.CLONE(); }

  top() { return this.top_; }
  set_top(top: LayoutUnit) {this.top_ = top.CLONE(); }

  right() { return this.right_; }
  set_right(right: LayoutUnit) { this.right_ = right.CLONE(); }

  bottom() { return this.bottom_; }
  set_bottom(bottom: LayoutUnit) {this.bottom_ = bottom.CLONE(); }

  SetInsets(left: LayoutUnit, top: LayoutUnit, right: LayoutUnit, bottom: LayoutUnit) {
    this.left_ = left.CLONE();
    this.top_ = top.CLONE();
    this.right_ = right.CLONE();
    this.bottom_ = bottom.CLONE();
  }

  EQ(insets: InsetsLayoutUnit) {
    return this.left_.EQ(insets.left_)
      && this.top_.EQ(insets.top_)
      && this.right_.EQ(insets.right_)
      && this.bottom_.EQ(insets.bottom_);
  }

  NE(insets: InsetsLayoutUnit) { return !this.EQ(insets); }

  ASS_ASSIGN(insets: InsetsLayoutUnit) {
    this.left_.ADD_ASSIGN(insets.left_);
    this.top_.ADD_ASSIGN(insets.top_);
    this.right_.ADD_ASSIGN(insets.right_);
    this.bottom_.ADD_ASSIGN(insets.bottom_);
  }
  ADD(rhs: InsetsLayoutUnit) {
    return new InsetsLayoutUnit(
      this.left_.ADD(rhs.left_),
      this.top_.ADD(rhs.top_),
      this.right_.ADD(rhs.right_),
      this.bottom_.ADD(rhs.bottom_),
    );
  }

  toString() {
    return `${this.left_},${this.top_},${this.right_},${this.bottom_}`;
  }

  zero(): boolean {
    return this.left_.EQ(new LayoutUnit())
      && this.top_.EQ(new LayoutUnit())
      && this.right_.EQ(new LayoutUnit())
      && this.bottom_.EQ(new LayoutUnit());
  }

  NEG() { return new InsetsLayoutUnit(this.left_.NEG(), this.top_.NEG(), this.right_.NEG(), this.bottom_.NEG()); }
}
