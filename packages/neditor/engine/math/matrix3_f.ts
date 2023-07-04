import { DCHECK } from '@neditor/core/base/check';
import { Vector3dF } from './vector3d_f';
import { PointF } from './point_f';
import { equals } from '@neditor/core/base/common/array';

// This is only to make accessing indices self-explanatory.
const M00 = 0;
const M01 = 1;
const M02 = 2;
const M10 = 3;
const M11 = 4;
const M12 = 5;
const M20 = 6;
const M21 = 7;
const M22 = 8;
const M_END = 9;

export class Matrix3F {
  static MatrixToArrayCoords(i: number, j: number): number {
    DCHECK(i >= 0 && i < 3);
    DCHECK(j >= 0 && j < 3);
    return i * 3 + j;
  }

  data_: [number, number, number, number, number, number, number, number, number,] = [0, 0, 0, 0, 0, 0, 0, 0, 0,];
  static Zeros() {
    let matrix = new Matrix3F();
    matrix.SetMatrix(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    return matrix;
  }
  static Ones() {
    let matrix = new Matrix3F();
    matrix.SetMatrix(1, 1, 1, 1, 1, 1, 1, 1, 1);
    return matrix;
  }
  static Identity() {
    let matrix = new Matrix3F();
    matrix.SetMatrix(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
    return matrix;
  }
  static FromOuterProduct(a: Vector3dF, bt: Vector3dF) {
    let matrix = new Matrix3F();
    matrix.SetMatrix(a.x() * bt.x(), a.x() * bt.y(), a.x() * bt.z(),
      a.y() * bt.x(), a.y() * bt.y(), a.y() * bt.z(),
      a.z() * bt.x(), a.z() * bt.y(), a.z() * bt.z());
    return matrix;
  }
  // static   FromArray(const float data[9]);
  static FromValues(m00: number, m01: number, m02: number, m10: number,
                    m11: number, m12: number, m20: number, m21: number,
                    m22: number): Matrix3F {
    let matrix = new Matrix3F();
    matrix.SetMatrix(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    return matrix;
  }

  SetMatrix(m00: number, m01: number, m02: number, m10: number, m11: number,
            m12: number, m20: number, m21: number, m22: number) {
    const { data_ } = this;
    data_[0] = m00;
    data_[1] = m01;
    data_[2] = m02;
    data_[3] = m10;
    data_[4] = m11;
    data_[5] = m12;
    data_[6] = m20;
    data_[7] = m21;
    data_[8] = m22;
  }

  IsZeros(): boolean {
    return this.data_[M00] == 0.0 && this.data_[M01] == 0.0 && this.data_[M02] == 0.0 &&
      this.data_[M10] == 0.0 && this.data_[M11] == 0.0 && this.data_[M12] == 0.0 &&
      this.data_[M20] == 0.0 && this.data_[M21] == 0.0 && this.data_[M22] == 0.0;
  }
  IsIdentity(): boolean {
    return this.data_[M00] == 1.0 && this.data_[M01] == 0.0 && this.data_[M02] == 0.0 &&
      this.data_[M10] == 0.0 && this.data_[M11] == 1.0 && this.data_[M12] == 0.0 &&
      this.data_[M20] == 0.0 && this.data_[M21] == 0.0 && this.data_[M22] == 1.0;
  }

  EQ(rhs: Matrix3F): boolean {
    return equals(this.data_, rhs.data_);

  }

  // // Element-wise comparison with given precision.
  // bool IsNear(const Matrix3F& rhs, float precision) const;
  //
  // Access data by row (i) and column (j).
  Get(i: number, j: number) {
    return this.data_[Matrix3F.MatrixToArrayCoords(i, j)];
  }
  // void Set(int i, int j, float v) { (*this)(i, j) = v; }
  //
  // float operator()(int i, int j) const {
  //   return data_[MatrixToArrayCoords(i, j)];
  // }
  // float& operator()(int i, int j) { return data_[MatrixToArrayCoords(i, j)]; }
  //
  MUL(rhs: PointF): PointF
  MUL(other: Matrix3F): Matrix3F
  MUL(other: unknown): Matrix3F | PointF {
    if (other instanceof Matrix3F) {
      let ret = new Matrix3F();
      const { data_ } = this;
      ret.data_[M00] = data_[M00] * other.data_[M00] +
        data_[M01] * other.data_[M10] +
        data_[M02] * other.data_[M20];
      ret.data_[M01] = data_[M00] * other.data_[M01] +
        data_[M01] * other.data_[M11] +
        data_[M02] * other.data_[M21];
      ret.data_[M02] = data_[M00] * other.data_[M02] +
        data_[M01] * other.data_[M12] +
        data_[M02] * other.data_[M22];

      ret.data_[M10] = data_[M10] * other.data_[M00] +
        data_[M11] * other.data_[M10] +
        data_[M12] * other.data_[M20];
      ret.data_[M11] = data_[M10] * other.data_[M01] +
        data_[M11] * other.data_[M11] +
        data_[M12] * other.data_[M21];
      ret.data_[M12] = data_[M10] * other.data_[M02] +
        data_[M11] * other.data_[M12] +
        data_[M12] * other.data_[M22];

      ret.data_[M20] = data_[M20] * other.data_[M00] +
        data_[M21] * other.data_[M10] +
        data_[M22] * other.data_[M20];
      ret.data_[M21] = data_[M20] * other.data_[M01] +
        data_[M21] * other.data_[M11] +
        data_[M22] * other.data_[M21];
      ret.data_[M22] = data_[M20] * other.data_[M02] +
        data_[M21] * other.data_[M12] +
        data_[M22] * other.data_[M22];

      return ret;
    } else if (other instanceof PointF) {
      let x = other.x() * this.data_[M00] + other.y() * this.data_[M01] + this.data_[M02];
      let y = other.x() * this.data_[M10] + other.y() * this.data_[M11] + this.data_[M12];
      let z = other.x() * this.data_[M20] + other.y() * this.data_[M21] + this.data_[M22];

      return new PointF(x / z, y / z);
    } else {
      throw new Error('500');
    }
  }

  //
  // Vector3dF column(int i) const {
  //   return Vector3dF(data_[MatrixToArrayCoords(0, i)],
  //                    data_[MatrixToArrayCoords(1, i)],
  //                    data_[MatrixToArrayCoords(2, i)]);
  // }
  //
  // void set_column(int i, const Vector3dF& c) {
  //   data_[MatrixToArrayCoords(0, i)] = c.x();
  //   data_[MatrixToArrayCoords(1, i)] = c.y();
  //   data_[MatrixToArrayCoords(2, i)] = c.z();
  // }
  //
  // Returns an inverse of this if the matrix is non-singular, zero (== Zero())
  // otherwise.
  Inverse(): Matrix3F {
    let inverse = Matrix3F.Zeros();
    let determinant = Determinant3x3(this.data_);
    if (Number.MIN_VALUE > Math.abs(determinant))
      return inverse;  // Singular matrix. Return Zeros().

    inverse.SetMatrix(
      (this.data_[M11] * this.data_[M22] - this.data_[M12] * this.data_[M21]) / determinant,
      (this.data_[M02] * this.data_[M21] - this.data_[M01] * this.data_[M22]) / determinant,
      (this.data_[M01] * this.data_[M12] - this.data_[M02] * this.data_[M11]) / determinant,
      (this.data_[M12] * this.data_[M20] - this.data_[M10] * this.data_[M22]) / determinant,
      (this.data_[M00] * this.data_[M22] - this.data_[M02] * this.data_[M20]) / determinant,
      (this.data_[M02] * this.data_[M10] - this.data_[M00] * this.data_[M12]) / determinant,
      (this.data_[M10] * this.data_[M21] - this.data_[M11] * this.data_[M20]) / determinant,
      (this.data_[M01] * this.data_[M20] - this.data_[M00] * this.data_[M21]) / determinant,
      (this.data_[M00] * this.data_[M11] - this.data_[M01] * this.data_[M10]) / determinant);
    return inverse;
  }
  //
  // // Value of the determinant of the matrix.
  // float Determinant() const;
  //
  // // Trace (sum of diagonal elements) of the matrix.
  // float Trace() const {
  //   return data_[MatrixToArrayCoords(0, 0)] + data_[MatrixToArrayCoords(1, 1)] +
  //          data_[MatrixToArrayCoords(2, 2)];
  // }
  //
  // // Compute eigenvalues and (optionally) normalized eigenvectors of
  // // a positive definite matrix *this. Eigenvectors are computed only if
  // // non-null |eigenvectors| matrix is passed. If it is NULL, the routine
  // // will not attempt to compute eigenvectors but will still return eigenvalues
  // // if they can be computed.
  // // If eigenvalues cannot be computed (the matrix does not meet constraints)
  // // the 0-vector is returned. Note that to retrieve eigenvalues, the matrix
  // // only needs to be symmetric while eigenvectors require it to be
  // // positive-definite. Passing a non-positive definite matrix will result in
  // // NaNs in vectors which cannot be computed.
  // // Eigenvectors are placed as column in |eigenvectors| in order corresponding
  // // to eigenvalues.
  // Vector3dF SolveEigenproblem(Matrix3F* eigenvectors) const;
  //
  // // Applies operator*(const PointF&) to each of the 4 points on the rectangle
  // // and then returns a RectF that is the tightest axis-aligned bounding box
  // // around those points.
  // RectF MapRect(const RectF& rect) const;
  //

  CLONE() {
    let matrix = new Matrix3F();
    matrix.SetMatrix(...this.data_);
    return matrix;
  }
};

// inline bool operator==(const Matrix3F& lhs, const Matrix3F& rhs) {
//   return lhs.IsEqual(rhs);
// }

// inline std::ostream& operator<<(std::ostream& stream, const Matrix3F& matrix) {
//   stream << "[";
//   stream << "[" << matrix(0, 0) << ", " << matrix(0, 1) << ", " << matrix(0, 2)
//          << "], ";
//   stream << "[" << matrix(1, 0) << ", " << matrix(1, 1) << ", " << matrix(1, 2)
//          << "], ";
//   stream << "[" << matrix(2, 0) << ", " << matrix(2, 1) << ", " << matrix(2, 2)
//          << "]";
//   stream << "]";
//   return stream;
// }

function Determinant3x3(data: Array<number>): number {
  // This routine is separated from the Matrix3F::Determinant because in
  // computing inverse we do want higher precision afforded by the explicit
  // use of 'double'.
  return (data[M00]) *
    ((data[M11]) * data[M22] -
      (data[M12]) * data[M21]) +
    (data[M01]) *
    ((data[M12]) * data[M20] -
      (data[M10]) * data[M22]) +
    (data[M02]) *
    ((data[M10]) * data[M21] -
      (data[M11]) * data[M20]);
}
