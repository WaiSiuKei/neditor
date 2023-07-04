// A floating-point version of Size.
import { SizeBase } from './size';

export class SizeF extends SizeBase {
  // SizeF() : SizeBase<SizeF, float>(0, 0) {}
  // SizeF(float width, float height) : SizeBase<SizeF, float>(width, height) {}
  // ~SizeF() {}

  // void Scale(float scale) { Scale(scale, scale); }
  //
  // void Scale(float x_scale, float y_scale) {
  //   SetSize(width() * x_scale, height() * y_scale);
  // }
  //
  // std::string ToString() const;
}

// inline bool operator==(const SizeF& lhs, const SizeF& rhs) {
//   return lhs.width() == rhs.width() && lhs.height() == rhs.height();
// }
//
// inline bool operator!=(const SizeF& lhs, const SizeF& rhs) {
//   return !(lhs == rhs);
// }
//
// SizeF ScaleSize(const SizeF& p, float x_scale, float y_scale);
//
// inline SizeF ScaleSize(const SizeF& p, float scale) {
//   return ScaleSize(p, scale, scale);
// }
//
// inline std::ostream& operator<<(std::ostream& stream, const SizeF& size) {
//   stream << "{width=" << size.width() << " height=" << size.height() << "}";
//   return stream;
// }
