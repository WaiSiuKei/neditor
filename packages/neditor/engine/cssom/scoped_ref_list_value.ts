// This class can be used to represent a CSS property value that is a list of
// ref-counted polymorphic objects.  All elements must be reference counted and
// also derive from base::PolymorphicEquatable so that they can be tested for
// equality by value.
import { PropertyValue } from './property_value';
import { DCHECK } from '@neditor/core/base/check';

export abstract class ScopedRefListValue<T extends any> extends PropertyValue {
  protected value_: T[];
  constructor(value: T[]) {
    super();
    this.value_ = value;
    DCHECK(value);
    DCHECK(value.length);
  }

  value() { return this.value_; }

  EQ(other: ScopedRefListValue<T>): boolean {
    if (this.value_.length !== other.value_.length) return false;
    for (let i = 0; i < this.value_.length; i++) {
      if (this.value_[i]) {

      }
    }
    return true;
  }
  // bool operator==(const ScopedRefListValue<LayoutUnit>& other) const {
  //   if (value_->size() != other.value_->size()) return false;
  //
  //   typename Builder::const_iterator iter_a = value_->begin();
  //   typename Builder::const_iterator iter_b = other.value_->begin();
  //   for (; iter_a != value_->end(); ++iter_a, ++iter_b) {
  //     if (!(*iter_a)->Equals(**iter_b)) {
  //       return false;
  //     }
  //   }
  //
  //   return true;
  // }
};
