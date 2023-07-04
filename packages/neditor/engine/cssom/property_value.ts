import type { PropertyValueVisitor } from './property_value_visitor';
import { TypeId } from '../base/type_id';

export abstract class PropertyValue {
  abstract Accept(visitor: PropertyValueVisitor): void;
  abstract ToString(): string;
  abstract GetTypeId(): TypeId
  abstract EQ(other: PropertyValue): boolean
}
