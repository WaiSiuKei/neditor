import { EnumAndLiteral } from '../../../base/common/typescript';
import { IIdentifier } from '../common';
import { ITypedRecord, RecordType } from './base';
import { IBlockRecord } from './block';

export interface IFragmentRecord extends ITypedRecord {
  type: EnumAndLiteral<RecordType.Fragment>;
  fragment: IIdentifier;
}
