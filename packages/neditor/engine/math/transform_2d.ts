// Get a transform matrix with only the specified translation.
import { Matrix3F } from './matrix3_f';
import { Vector2dF } from './vector2d_f';

export function TranslateMatrix(x: number, y: number): Matrix3F
export function TranslateMatrix(translate: Vector2dF): Matrix3F
export function TranslateMatrix(a1: unknown, a2?: unknown): Matrix3F {
  let x: number;
  let y: number;
  if (arguments.length === 1) {
    let translate = a1 as Vector2dF;
    x = translate.x();
    y = translate.y();
  } else {
    x = a1 as number;
    y = a2 as number;
  }

  return Matrix3F.FromValues(1.0, 0, x, 0, 1.0, y, 0, 0, 1.0);
}

// Get a transform matrix with only the specified scaling.
export function ScaleMatrix(x_scale: number, y_scale = x_scale): Matrix3F {
  return Matrix3F.FromValues(1.0, 0, x_scale, 0, 1.0, y_scale, 0, 0, 1.0);

}

//
// Get a transform matrix with only the specified rotation.
export function RotateMatrix(counter_clockwise_angle_in_radians: number): Matrix3F {
  let sin_theta = Math.sin(counter_clockwise_angle_in_radians);
  let cos_theta = Math.cos(counter_clockwise_angle_in_radians);

  // Rotation matrix for a space where up is represented by negative y.
  return Matrix3F.FromValues(cos_theta, sin_theta, 0, -sin_theta, cos_theta, 0,
    0, 0, 1.0);
}
// // Get the x-axis and y-axis scale factors of the given transform.
// Vector2dF GetScale2d(const Matrix3F& transform);
//
// // Determine if the given transform only scales and/or translates.
export function IsOnlyScaleAndTranslate(transform: Matrix3F) {
  const kEpsilon = 0.0001;
  return Math.abs(transform.Get(0, 1)) < kEpsilon &&
    Math.abs(transform.Get(1, 0)) < kEpsilon &&
    Math.abs(transform.Get(2, 0)) < kEpsilon &&
    Math.abs(transform.Get(2, 1)) < kEpsilon &&
    Math.abs(transform.Get(2, 2) - 1.0) < kEpsilon;
}
