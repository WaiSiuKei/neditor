import { EnumAndLiteral } from '../../../base/common/typescript';
import { ITypedRecord, RecordType } from './base';

export enum LayoutType {
  float = 'float',
  table = 'table',
  flex = 'flex',
  grid = 'grid'
}

export interface IBlockRecord extends ITypedRecord {
  type: EnumAndLiteral<RecordType.Block>;
  display: EnumAndLiteral<LayoutType>;
}

export function isBlock(n: ITypedRecord): n is IBlockRecord {
  return n.type === RecordType.Block;
}
