// The rotate function specifies a 2D rotation operation by the the specified
// angle.
//   https://www.w3.org/TR/css-transforms-1/#funcdef-rotate
import { TransformFunction } from './transform_function';
import { TransformFunctionVisitor } from './transform_function_visitor';
import { SizeF } from '../math/size_f';
import { RotateMatrix } from '../math/transform_2d';

export class RotateFunction extends TransformFunction {
  private clockwise_angle_in_radians_: number;

  constructor(
    clockwise_angle_in_radians: number
  ) {
    super();
    this.clockwise_angle_in_radians_ = clockwise_angle_in_radians;
  }

  Accept(visitor: TransformFunctionVisitor) {
    visitor.VisitRotate(this);
  }

  clockwise_angle_in_radians() {
    return this.clockwise_angle_in_radians_;
  }

  ToString() {
    return `rotate(${this.clockwise_angle_in_radians_}grad)`;
  }

  ToMatrix(used_size: SizeF) {
    return RotateMatrix(-this.clockwise_angle_in_radians_);
  }

  EQ(other: RotateFunction) {
    return this.clockwise_angle_in_radians_ === other.clockwise_angle_in_radians_;
  }

};

