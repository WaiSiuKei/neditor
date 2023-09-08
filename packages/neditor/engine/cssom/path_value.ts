import { NOTIMPLEMENTED } from '../../base/common/notreached';
import { Optional } from '../../base/common/typescript';
import { Path } from '../../base/graphics/path';
import { PathSegment } from '../../base/graphics/types';
import { LayoutUnit } from '../layout/layout_unit';
import { PropertyValue } from './property_value';
import { PropertyValueVisitor } from './property_value_visitor';
import { baseGetTypeId, TypeId } from '../base/type_id';

export class PathValue extends PropertyValue {
  segments: PathSegment[];
  length: number;
  constructor(private input: string) {
    super();
    this.segments = Path.parsePathData(input);
    this.length = Path.getPathLength(this.segments);
  }

  get lengthUnit() {
    return new LayoutUnit(this.length);
  }

  IsPathValue(): this is PathValue {
    return true;
  }
  AsPathValue(): Optional<PathValue> {
    return this;
  }

  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitPath(this);
  }

  ToString(): string {
    return this.input;
  }

  EQ(other: PathValue): boolean {
    return this.input === other.input;
  }

  GetTypeId(): TypeId {
    return baseGetTypeId(PathValue);
  }
}
