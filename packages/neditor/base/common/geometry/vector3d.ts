
export class Vector3d {
   x_: number
    y_: number
    z_: number

  constructor(x: number, y: number, z: number) {
    this.x_ = x;
    this.y_ = y;
    this.z_ = z;
  }

  SetVector(x: number, y: number, z: number) {
    this.x_ = x;
    this.y_ = y;
    this.z_ = z;
  }

  get x() { return this.x_; }
  set x(x: number) {this.x_ = x; }

  get y() { return this.y_; }
  set y(y: number) {this.y_ = y; }

  get z() { return this.z_; }
  set z(z: number) {this.z_ = z; }

  // True if all components of the vector are 0.
  // bool IsZero() const;
  //
  // // Add the components of the |other| vector to the current vector.
  // void Add(const Vector3dF& other);
  // // Subtract the components of the |other| vector from the current vector.
  // void Subtract(const Vector3dF& other);
  //
  // void operator+=(const Vector3dF& other) { Add(other); }
  // void operator-=(const Vector3dF& other) { Subtract(other); }
  //
  // void SetToMin(const Vector3dF& other) {
  //   x_ = x_ <= other.x_ ? x_ : other.x_;
  //   y_ = y_ <= other.y_ ? y_ : other.y_;
  //   z_ = z_ <= other.z_ ? z_ : other.z_;
  // }
  //
  // void SetToMax(const Vector3dF& other) {
  //   x_ = x_ >= other.x_ ? x_ : other.x_;
  //   y_ = y_ >= other.y_ ? y_ : other.y_;
  //   z_ = z_ >= other.z_ ? z_ : other.z_;
  // }
  //
  // // Gives the square of the diagonal length of the vector.
  // double LengthSquared() const;
  // // Gives the diagonal length of the vector.
  // float Length() const;
  //
  // // Scale all components of the vector by |scale|.
  // void Scale(float scale) { Scale(scale, scale, scale); }
  // // Scale the each component of the vector by the given scale factors.
  // void Scale(float x_scale, float y_scale, float z_scale);
  //
  // // Take the cross product of this vector with |other| and become the result.
  // void Cross(const Vector3dF& other);
  //
  // std::string ToString() const;

};

// inline bool operator==(const Vector3dF& lhs, const Vector3dF& rhs) {
//   return lhs.x() == rhs.x() && lhs.y() == rhs.y() && lhs.z() == rhs.z();
// }
//
// inline Vector3dF operator-(const Vector3dF& v) {
//   return Vector3dF(-v.x(), -v.y(), -v.z());
// }
//
// inline Vector3dF operator+(const Vector3dF& lhs, const Vector3dF& rhs) {
//   Vector3dF result = lhs;
//   result.Add(rhs);
//   return result;
// }
//
// inline Vector3dF operator-(const Vector3dF& lhs, const Vector3dF& rhs) {
//   Vector3dF result = lhs;
//   result.Add(-rhs);
//   return result;
// }
//
// // Return the cross product of two vectors.
// inline Vector3dF CrossProduct(const Vector3dF& lhs, const Vector3dF& rhs) {
//   Vector3dF result = lhs;
//   result.Cross(rhs);
//   return result;
// }
//
// // Return the dot product of two vectors.
// float DotProduct(const Vector3dF& lhs, const Vector3dF& rhs);
//
// // Return a vector that is |v| scaled by the given scale factors along each
// // axis.
// Vector3dF ScaleVector3d(const Vector3dF& v, float x_scale, float y_scale,
//                         float z_scale);
//
// // Return a vector that is |v| scaled by the given scale factor.
// inline Vector3dF ScaleVector3d(const Vector3dF& v, float scale) {
//   return ScaleVector3d(v, scale, scale, scale);
// }
