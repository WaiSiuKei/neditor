import { Optional } from '../../base/common/typescript';
import type { PathValue } from './path_value';
import type { PropertyValueVisitor } from './property_value_visitor';
import type { TypeId } from '../base/type_id';

export abstract class PropertyValue {
  abstract Accept(visitor: PropertyValueVisitor): void;
  abstract ToString(): string;
  abstract GetTypeId(): TypeId
  abstract EQ(other: PropertyValue): boolean
  IsPathValue(): this is PathValue {
    return false;
  }
  AsPathValue(): Optional<PathValue> {
    return undefined;
  }
}
