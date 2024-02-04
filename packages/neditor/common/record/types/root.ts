import { EnumAndLiteral } from '../../../base/common/typescript';
import { ITypedRecord, RecordType } from './base';

export interface IRootRecord extends ITypedRecord {
  type: EnumAndLiteral<RecordType.Root>;
}
