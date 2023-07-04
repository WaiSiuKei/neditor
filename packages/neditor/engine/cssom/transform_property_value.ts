// A base class for all CSS transform property values.
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { SizeF } from '../math/size_f';
import { Matrix3F } from '../math/matrix3_f';
import { Trait } from './transform_function';

export abstract class TransformPropertyValue extends PropertyValue {

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitTransformPropertyValue(this);
  }

  // Returns whether the transform has any functions with the specified trait.
  abstract HasTrait(trait: Trait): boolean

  abstract ToMatrix(used_size: SizeF): Matrix3F
};
