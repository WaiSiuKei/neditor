import { Insets } from '../../../../base/common/geometry/insets';
import { Rect } from '../../../../base/common/geometry/rect';

const kEpsilon = 0.0001;

// RoundedCorner represents one of the corners of an rectangle. It contains the
// lengths of the semi-major axis and the semi-minor axis of an ellipse.
export class RoundedCorner {
  // |horizontal| and |vertical| represent the horizontal radius and vertical
  // radius of a corner.
  horizontal: number;
  vertical: number;
  constructor(horizontal = 0,
              vertical = 0) {
    this.horizontal = horizontal;
    this.vertical = vertical;
  }

  //  If either length is zero-ish, the corner is square, not rounded.
  IsSquare() {
    return this.horizontal <= kEpsilon || this.vertical <= kEpsilon;
  }

  Inset(x: number,
        y: number): RoundedCorner {
    return new RoundedCorner(Math.max(0.0, this.horizontal - x),
      Math.max(0, this.vertical - y));
  }

  COPY(): RoundedCorner {
    return new RoundedCorner(this.horizontal, this.vertical);
  }

  EQ(other: RoundedCorner) {
    return this.horizontal == other.horizontal && this.vertical == other.vertical;
  }
  GE(other: RoundedCorner) {
    return this.horizontal >= other.horizontal && this.vertical >= other.vertical;
  }
}

// RoundedCorners represents 4 rounded corners of an rectangle. Top left, top
// right, bottom right and bottom left.
export class RoundedCorners {
  top_left: RoundedCorner = new RoundedCorner();
  top_right: RoundedCorner = new RoundedCorner();
  bottom_right: RoundedCorner = new RoundedCorner();
  bottom_left: RoundedCorner = new RoundedCorner();
  constructor()
  constructor(corner: RoundedCorner)
  constructor(radiuses: RoundedCorners)
  constructor(horizontal: number,
              vertical: number)
  constructor(top_left: RoundedCorner,
              top_right: RoundedCorner,
              bottom_right: RoundedCorner,
              bottom_left: RoundedCorner)
  constructor(a1?: unknown,
              a2?: unknown,
              a3?: unknown,
              a4?: unknown) {
    if (!arguments.length) return;
    if (arguments.length == 1) {
      if (a1 instanceof RoundedCorner) {
        this.top_left = a1.COPY();
        this.top_right = a1.COPY();
        this.bottom_right = a1.COPY();
        this.bottom_left = a1.COPY();
      } else if (a1 instanceof RoundedCorners) {
        this.top_left = a1.top_left.COPY();
        this.top_right = a1.top_right.COPY();
        this.bottom_right = a1.bottom_right.COPY();
        this.bottom_left = a1.bottom_left.COPY();
      } else {
        throw new Error('400');
      }
    } else if (arguments.length == 2) {
      this.top_left = new RoundedCorner(a1 as number, a2 as number);
      this.top_right = new RoundedCorner(a1 as number, a2 as number);
      this.bottom_right = new RoundedCorner(a1 as number, a2 as number);
      this.bottom_left = new RoundedCorner(a1 as number, a2 as number);
    } else {
      this.top_left = a1 as RoundedCorner;
      this.top_right = a2 as RoundedCorner;
      this.bottom_right = a3 as RoundedCorner;
      this.bottom_left = a4 as RoundedCorner;
    }
  }
  EQ(other: RoundedCorners) {
    return this.top_left.EQ(other.top_left)
      && this.top_right.EQ(other.top_right)
      && this.bottom_right.EQ(other.bottom_right)
      && this.bottom_left.EQ(other.bottom_left);
  }

  Inset(insets: Insets): RoundedCorners
  Inset(left: number,
        top: number,
        right: number,
        bottom: number): RoundedCorners
  Inset(a1: unknown,
        a2?: unknown,
        a3?: unknown,
        a4?: unknown): RoundedCorners {
    let top: number;
    let right: number;
    let bottom: number;
    let left: number;
    if (arguments.length === 4) {
      left = a1 as number;
      top = a2 as number;
      right = a3 as number;
      bottom = a4 as number;
    } else {
      let insets = a1 as Insets;
      left = insets.left;
      top = insets.top;
      right = insets.right;
      bottom = insets.bottom;
    }
    return new RoundedCorners(
      this.top_left.Inset(left, top), this.top_right.Inset(right, top),
      this.bottom_right.Inset(right, bottom), this.bottom_left.Inset(left, bottom));
  }

  Scale(sx: number,
        sy: number): RoundedCorners {
    return new RoundedCorners(
      new RoundedCorner(this.top_left.horizontal * sx, this.top_left.vertical * sy),
      new RoundedCorner(this.top_right.horizontal * sx, this.top_right.vertical * sy),
      new RoundedCorner(this.bottom_right.horizontal * sx, this.bottom_right.vertical * sy),
      new RoundedCorner(this.bottom_left.horizontal * sx, this.bottom_left.vertical * sy));
  }

// Ensure the rounded corners' radii do not exceed the length of the
// corresponding edge of the given rect.
  Normalize(rect: Rect): RoundedCorners {
    let scale = 1.0;
    let size;

    // Normalize overlapping curves.
    // https://www.w3.org/TR/css3-background/#corner-overlap
    // Additionally, normalize opposing curves so the corners do not overlap.
    size = this.top_left.horizontal +
      Math.max(this.top_right.horizontal, this.bottom_right.horizontal);
    if (size > rect.width) {
      scale = rect.width / size;
    }

    size = this.bottom_left.horizontal +
      Math.max(this.bottom_right.horizontal, this.top_right.horizontal);
    if (size > rect.width) {
      scale = Math.min(rect.width / size, scale);
    }

    size =
      this.top_left.vertical + Math.max(this.bottom_left.vertical, this.bottom_right.vertical);
    if (size > rect.height) {
      scale = Math.min(rect.height / size, scale);
    }

    size = this.top_right.vertical +
      Math.max(this.bottom_right.vertical, this.bottom_left.vertical);
    if (size > rect.height) {
      scale = Math.min(rect.height / size, scale);
    }

    scale = Math.max(scale, 0.0);
    return this.Scale(scale, scale);
  }
  IsNormalized(rect: Rect): boolean {
    // Introduce a fuzz epsilon so that we are not strict about rounding errors
    // when computing Normalize().
    const fuzzed_width = rect.width + kEpsilon;
    const fuzzed_height = rect.height + kEpsilon;

    return (
      // Adjacent corners must not overlap.
      this.top_left.horizontal + this.top_right.horizontal <= fuzzed_width &&
      this.bottom_left.horizontal + this.bottom_right.horizontal <= fuzzed_width &&
      this.top_left.vertical + this.bottom_left.vertical <= fuzzed_height &&
      this.top_right.vertical + this.bottom_right.vertical <= fuzzed_height &&
      // Opposing corners must not overlap.
      this.top_left.horizontal + this.bottom_right.horizontal <= fuzzed_width &&
      this.bottom_left.horizontal + this.top_right.horizontal <= fuzzed_width &&
      this.top_left.vertical + this.bottom_right.vertical <= fuzzed_height &&
      this.top_right.vertical + this.bottom_left.vertical <= fuzzed_height
    );
  }

  AreSquares(): boolean {
    return this.top_left.IsSquare() && this.top_right.IsSquare() &&
      this.bottom_right.IsSquare() && this.bottom_left.IsSquare();
  }

// Returns true if all corners have the same value as the input.
  AllCornersEqual(rhs: RoundedCorner): boolean {
    return this.top_left.EQ(rhs) && this.top_right.EQ(rhs) && this.bottom_right.EQ(rhs) &&
      this.bottom_left.EQ(rhs);
  }

// Returns true if all corners' radii are greater than or equal to the
// corresponding radii of the input.
  AllCornersGE(rhs: RoundedCorner): boolean {
    return this.top_left.GE(rhs) && this.top_right.GE(rhs) && this.bottom_right.GE(rhs) &&
      this.bottom_left.GE(rhs);
  }

}
