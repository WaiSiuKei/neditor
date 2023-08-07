import * as Y from 'yjs';
import { EnumAndLiteral } from '../base/common/typescript';
import { IIdentifier } from './common';
import { IBlockStyleDeclaration, IInlineStyleDeclaration } from './style';

export enum NodeType {
  Root = 'root',
  Image = 'image',
  Text = 'text',
  Block = 'block',
  Fragment = 'fragment'
}

export interface ITextNodeModel {
  id: IIdentifier;
  type: EnumAndLiteral<NodeType.Text>;
  from: IIdentifier;
  order: string;
  style: IInlineStyleDeclaration;
  content: string;
}

export interface IBlockNodeModel {
  id: IIdentifier;
  type: EnumAndLiteral<NodeType.Block>;
  from: IIdentifier;
  order: string;
  style: IBlockStyleDeclaration;
}

export interface IFragmentNodeModel {
  id: IIdentifier;
  type: EnumAndLiteral<NodeType.Fragment>;
  from: IIdentifier;
  order: string;
  //
  fragment: IIdentifier;
  // ts-happy
  style?: any;
}

export interface IRootNodeModel {
  id: IIdentifier;
  type: EnumAndLiteral<NodeType.Root>;
  // ts-happy
  from?: any;
  order?: any;
  style?: any;
}

export type INodeModel = ITextNodeModel | IBlockNodeModel | IRootNodeModel | IFragmentNodeModel

export type YNode = Y.Map<YNodeValue>
export type YNodeValue = string | Y.Map<string>;

export function getNodeId(n: YNode): string {
  return n.get('id') as string;
}
export function getNodeFrom(n: YNode): string {
  return n.get('from') as string;
}
export function getNodeOrder(n: YNode): string {
  return n.get('order') as string;
}
export function getNodeType(n: YNode): NodeType {
  return n.get('type') as NodeType;
}
export function getNodeContent(n: YNode): string {
  return n.get('content') as string;
}
export function getNodeStyle(n: YNode): Y.Map<string> {
  return n.get('style') as Y.Map<string>;
}

export function isYNode(val: Y.Map<any>): val is YNode {
  return val.get('id') && val.get('type');
}
export function isYNodeStyle(val: Y.Map<any>): boolean {
  const parent = val.parent;
  return !!parent && val.parent instanceof Y.Map && isYNode(val.parent);
}

