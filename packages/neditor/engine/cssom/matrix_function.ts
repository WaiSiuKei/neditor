// The matrix function allows one to specify a 2D 2x3 affine transformation
// as a matrix.
//   https://www.w3.org/TR/css-transforms-1/#funcdef-matrix
import { TransformFunction } from './transform_function';
import { Matrix3F } from '../math/matrix3_f';
import { TransformFunctionVisitor } from './transform_function_visitor';
import { SizeF } from '../math/size_f';

export class MatrixFunction extends TransformFunction {
  private value_: Matrix3F;

  constructor(matrix: Matrix3F)
  constructor(m00: number, m10: number, m01: number, m11: number, m02: number, m12: number)
  constructor(m00: unknown, m10?: number, m01?: number, m11?: number, m02?: number, m12?: number) {
    super();
    if (arguments.length === 1) {
      this.value_ = m00 as Matrix3F;
    } else {
      this.value_ = Matrix3F.FromValues(m00 as number, m01!, m02!, m10!, m11!, m12!, 0.0, 0.0, 1.0);
    }
  }

  Accept(visitor: TransformFunctionVisitor) {
    visitor.VisitMatrix(this);
  }

  value() { return this.value_; }

  ToString() {
    const { value_ } = this;
    return `matrix(${value_.Get(0, 0)}, ${value_.Get(1, 0)}, ${value_.Get(0, 1)}, ${value_.Get(1, 1)}, ${value_.Get(0, 2)}, ${value_.Get(1, 2)})`;
  }

  ToMatrix(used_size: SizeF/*,
                          const scoped_refptr<ui_navigation::NavItem>&
                              used_ui_nav_focus*/): Matrix3F {
    return this.value_;
  }

  EQ(other: MatrixFunction): boolean {
    return this.value_.EQ(other.value_);
  }

};
