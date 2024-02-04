import { EnumAndLiteral } from '../../../base/common/typescript';
import { ICommonStyleDeclaration, ITypedRecord, RecordType } from './base';

export interface ITextRecord extends ITypedRecord, ITextStyleDeclaration {
  type: EnumAndLiteral<RecordType.Text>;
  content: string;
}

export interface ITextStyleDeclaration extends ICommonStyleDeclaration {
  // fontSize: number,
  // fontFamily: string,
  // fontWeight: number,
}

export function isTextRecord(n: ITypedRecord): n is ITextRecord {
  return n.type === RecordType.Text;
}
