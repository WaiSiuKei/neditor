// A selector's specificity is calculated as follows:
// Count the number of ID selectors in the selector (A)
// Count the number of class selectors, attributes selectors, and
// pseudo-classes in the selector (B)
// Count the number of type selectors and pseudo-elements in the selector (C)
//   https://www.w3.org/TR/selectors4/#specificity
// When adding two specificities, clampping the result at each field (A, B and
// C).
import { DCHECK_GE } from '@neditor/core/base/check_op';

export class Specificity {
  private v_: [number, number, number] = [0, 0, 0];

  constructor(a = 0, b = 0, c = 0) {
    DCHECK_GE(a, 0, 'Specificity field cannot be negative.');
    DCHECK_GE(b, 0, 'Specificity field cannot be negative.');
    DCHECK_GE(c, 0, 'Specificity field cannot be negative.');
    this.v_[0] = a;
    this.v_[1] = b;
    this.v_[2] = c;
  }

  // Adds the value of another specificity to self.
  // void AddFrom(const Specificity& rhs);
  //
  // Specificity fields are compared lexicographically.
  LT(rhs: Specificity) {
    const { v_ } = this;

    return v_[0] < rhs.v_[0] ||
      (v_[0] == rhs.v_[0] &&
        (v_[1] < rhs.v_[1] || (v_[1] == rhs.v_[1] && v_[2] < rhs.v_[2])));
  }
  // bool operator>(const Specificity& rhs) const {
  //   return v_[0] > rhs.v_[0] ||
  //          (v_[0] == rhs.v_[0] &&
  //           (v_[1] > rhs.v_[1] || (v_[1] == rhs.v_[1] && v_[2] > rhs.v_[2])));
  // }
  EQ(rhs: Specificity) {
    const { v_ } = this;
    return v_[0] == rhs.v_[0] && v_[1] == rhs.v_[1] && v_[2] == rhs.v_[2];
  }
};
