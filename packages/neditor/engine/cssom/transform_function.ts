import { SizeF } from '../math/size_f';
import { Matrix3F } from '../math/matrix3_f';
import { TransformFunctionVisitor } from './transform_function_visitor';

export enum Trait {
  // The value of this transform function changes over time. Custom transform
  // functions (e.g. those that work with UI navigation) may have this trait.
  // Standard transform functions do not have this trait.
  kTraitIsDynamic = 1 << 0,

  // This function uses LengthValue and LengthValue::IsUnitRelative() is true.
  // Use of PercentageValue does not equate to having this trait.
  kTraitUsesRelativeUnits = 1 << 1,

  // This function queries a UI navigation focus item during evaluation.
  kTraitUsesUiNavFocus = 1 << 2,
};

// A base class for all transform functions.
// Transform functions define how transformation is applied to the coordinate
// system an HTML element renders in.
//   https://www.w3.org/TR/css-transforms-1/#transform-functions
export abstract class TransformFunction {
  protected traits_ = 0;
  abstract Accept(visitor: TransformFunctionVisitor): void

  abstract ToString(): string

  abstract ToMatrix(used_size: SizeF): Matrix3F

  abstract EQ(rhs: TransformFunction): boolean

  Traits(): Trait { return this.traits_; }
  HasTrait(trait: Trait): boolean { return (this.traits_ & trait) != 0; }
};
