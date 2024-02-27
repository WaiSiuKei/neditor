import { EnumAndLiteral } from '../../../base/common/typescript';
import { IIdentifier } from '../common';

export interface ICommonStyleDeclaration {
  width: number;
  height: number;
  top: number;
  left: number;
  // margin
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  // padding
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
}

export interface ITypedRecord extends ICommonStyleDeclaration {
  readonly id: IIdentifier;
  readonly type: EnumAndLiteral<RecordType>;
  from: IIdentifier;
  order: string;
}

export enum RecordType {
  Root = 'root',
  Image = 'image',
  Text = 'text',
  Block = 'block',
  Fragment = 'fragment'
}
