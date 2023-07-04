import { TransformPropertyValue } from './transform_property_value';
import { Trait, TransformFunction } from './transform_function';
import { deepClone } from '@neditor/core/base/common/objects';
import { SizeF } from '../math/size_f';
import { Matrix3F } from '../math/matrix3_f';
import { baseGetTypeId, TypeId } from '../base/type_id';

export type  FunctionList = TransformFunction[]

export class TransformFunctionListValueBuilder {
  private functions_: FunctionList = [];
  private traits_: number = 0;

  constructor()
  constructor(other: TransformFunctionListValueBuilder)
  constructor(other?: TransformFunctionListValueBuilder) {
    if (other) {
      this.functions_ = deepClone(other.functions_);
      this.traits_ = other.traits_;
    }
  }
  [Symbol.iterator]() {
    let index = 0;

    return {
      next: () => {
        if (index < this.functions_.length) {
          return { value: this.functions_[index++], done: false };
        } else {
          return { done: true };
        }
      }
    };
  };

  push(func: TransformFunction) {
    this.traits_ |= func.Traits();
    this.functions_.push(func);
  }
  // const_iterator begin() const { return functions_.begin(); }
// const_iterator end() const { return functions_.end(); }
  get length(): number { return this.functions_.length; }
  getItem(index: number) {
    return this.functions_[index];
  }

// This checks whether any function in the list has the given trait.
  HasTrait(trait: Trait): boolean {
    return (this.traits_ & trait) != 0;
  }
}

// A list of transform functions that define how transformation is applied
// to the coordinate system an HTML element renders in.
//   https://www.w3.org/TR/css-transforms-1/#typedef-transform-list
export class TransformFunctionListValue extends TransformPropertyValue {
  private value_: TransformFunctionListValueBuilder;

  constructor(value: TransformFunctionListValueBuilder) {
    super();
    this.value_ = value;
  }

  ToString() {
    let result = '';
    for (let i = 0; i < this.value().length; ++i) {
      if (result.length) result += (' ');
      result += (this.value().getItem(i).ToString());
    }
    return result;
  }

  value() { return this.value_; }

  ToMatrix(used_size: SizeF): Matrix3F {
    let matrix = Matrix3F.Identity();
    for (let func of this.value()) {
      matrix = matrix.MUL(func!.ToMatrix(used_size));
    }
    return matrix;
  }

  EQ(other: TransformFunctionListValue) {
    if (this.value().length != other.value().length) {
      return false;
    }

    for (let i = 0; i < this.value().length; ++i) {
      if (!this.value().getItem(i).EQ(other.value().getItem(i))) {
        return false;
      }
    }

    return true;
  }

  HasTrait(trait: Trait): boolean {
    return this.value_.HasTrait(trait);
  }
  GetTypeId(): TypeId {
    return baseGetTypeId(TransformFunctionListValue);
  }
}

