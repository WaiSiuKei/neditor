// Scale function specifies a 2D scale operation by the scaling vector.
//   https://www.w3.org/TR/css-transforms-1/#funcdef-scale
import { TransformFunction } from './transform_function';
import { TransformFunctionVisitor } from './transform_function_visitor';
import { SizeF } from '../math/size_f';
import { ScaleMatrix } from '../math/transform_2d';

export class ScaleFunction extends TransformFunction {
  private x_factor_: number;
  private y_factor_: number;
  constructor(
    x_factor: number,
    y_factor: number,
  ) {
    super();
    this.x_factor_ = x_factor;
    this.y_factor_ = y_factor;
  }

  Accept(visitor: TransformFunctionVisitor) {
    visitor.VisitScale(this);
  }

  x_factor() { return this.x_factor_; }
  y_factor() { return this.y_factor_; }

  ToString() {
    // if (y_factor_ == 1.0f) {
    //   return base::StringPrintf("scaleX(%.7g)", x_factor_);
    // }
    // if (x_factor_ == 1.0f) {
    //   return base::StringPrintf("scaleY(%.7g)", y_factor_);
    // }
    return `scale(${this.x_factor_}, ${this.y_factor_})`;
  }

  ToMatrix(used_size: SizeF) {
    return ScaleMatrix(this.x_factor_, this.y_factor_);
  }

  EQ(other: ScaleFunction) {
    return this.x_factor_ === other.x_factor_ && this.y_factor_ === other.y_factor_;
  }

};
