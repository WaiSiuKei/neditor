// A style of a border segment.
import { ColorRGBA } from './color_rgba';

export enum BorderStyle {
  // A border segment along the given side should not be drawn.
  kBorderStyleNone,
  // A border segment along the given side should be drawn.
  kBorderStyleSolid
};

// Style properties for one of four sides of a border around a rectangle.
export class BorderSide {
  width: number;
  style: BorderStyle;
  color: ColorRGBA;
  constructor(that: BorderSide)
  constructor(width: number, style: BorderStyle, color: ColorRGBA)
  constructor(a1: unknown, style?: BorderStyle, color?: ColorRGBA) {
    if (a1 instanceof BorderSide) {
      this.width = a1.width;
      this.style = a1.style;
      this.color = a1.color.CLONE();
    } else {
      this.width = a1 as number;
      this.style = style!;
      this.color = color!;
    }
  }

  EQ(rhs: BorderSide) {

    return this.style == rhs.style && this.color.EQ(rhs.color) && this.width == rhs.width;
  }
  NE(rhs: BorderSide) {
    return !this.EQ(rhs);
  }
}

// A border around a rectangle.
export class Border {
  left: BorderSide;
  right: BorderSide;
  top: BorderSide;
  bottom: BorderSide;
  constructor(border_side: BorderSide)
  constructor(left: BorderSide, right: BorderSide, top: BorderSide, bottom: BorderSide)
  constructor(a1: BorderSide, right?: BorderSide, top?: BorderSide, bottom?: BorderSide) {
    if (arguments.length === 1) {
      this.left = a1;
      this.right = a1;
      this.top = a1;
      this.bottom = a1;
    } else {
      this.left = a1;
      this.right = right!;
      this.top = top!;
      this.bottom = bottom!;
    }
  }

  EQ(other: Border) {
    return this.left == other.left && this.right == other.right && this.top == other.top &&
      this.bottom == other.bottom;
  }
}



