import * as Y from 'yjs';
import { EnumAndLiteral } from '../base/common/typescript';
import { IIdentifier } from './common';
import { IStyleDeclaration } from './style';

export enum NodeType {
  Root = 'root',
  Image = 'image',
  Text = 'text',
  Block = 'block',
  Fragment = 'fragment'
}

export type IInlineStyle = Partial<IStyleDeclaration>;

export interface BlockLevelMarks {
  textAlign: string
  lineHeight: string
  // 'text-align': '',
  // 'text-align-last': '',
  // 'text-anchor': '',
  // 'text-combine-upright': '',
  // 'text-decoration': '',
  // 'text-decoration-color': '',
  // 'text-decoration-line': '',
  // 'text-decoration-style': '',
  // 'text-emphasis': '',
  // 'text-emphasis-color': '',
  // 'text-emphasis-position': '',
  // 'text-emphasis-style': '',
  // 'text-indent': '',
  // 'text-justify': '',
  // 'text-orientation': '',
  // 'text-overflow': '',
  // 'text-rendering': '',
  // 'text-shadow': '',
  // 'text-transform': '',
  // 'text-underline-position': '',
  fontSize: string,
  fontFamily: string,
  fontWeight: string,
}

export interface InlineLevelMarks {
  fontSize: string,
  fontFamily: string,
  fontWeight: string,
  // 'font-family': '',
  // 'font-feature-settings': '',
  // 'font-kerning': '',
  // 'font-size': '',
  // 'font-size-adjust': '',
  // 'font-stretch': '',
  // 'font-style': '',
  // 'font-synthesis': '',
  // 'font-variant': '',
  // 'font-variant-caps': '',
  // 'font-variant-east-asian': '',
  // 'font-variant-ligatures': '',
  // 'font-variant-numeric': '',
  // 'font-variant-position': '',
  // 'font-weight': '',
}

export interface ITextNodeModel {
  id: IIdentifier;
  type: EnumAndLiteral<NodeType.Text>;
  from: IIdentifier;
  order: string;
  style: Partial<InlineLevelMarks> & Partial<BlockLevelMarks> & IInlineStyle;
  content: string;
}

export interface IBlockNodeModel {
  id: IIdentifier;
  type: EnumAndLiteral<NodeType.Block>;
  from: IIdentifier;
  order: string;
  style: Partial<BlockLevelMarks> & IInlineStyle;
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

export type YNodeBase = Y.Map<YNodeValue>
export type YNodeValue = string | Y.Map<string>;

export interface YRootNode extends YNodeBase {
  get(str: 'type'): NodeType.Root;
  get(str: string): YNodeValue;
}

export interface YImageNode extends YNodeBase {
  get(str: 'type'): NodeType.Image;
  get(str: string): YNodeValue;
}

export interface YTextNode extends YNodeBase {
  get(str: 'type'): NodeType.Text;
  get(str: string): YNodeValue;
}

export interface YBlockNode extends YNodeBase {
  get(str: 'type'): NodeType.Block;
  get(str: string): YNodeValue;
}

export interface YFragmentNode extends YNodeBase {
  get(str: 'type'): NodeType.Fragment;
  get(str: string): YNodeValue;
}

export type YNode = YRootNode | YImageNode | YTextNode | YBlockNode | YFragmentNode

export function getNodeId(n: YNodeBase): string {
  return n.get('id') as string;
}
export function getNodeFrom(n: YNodeBase): string {
  return n.get('from') as string;
}
export function getNodeOrder(n: YNodeBase): string {
  return n.get('order') as string;
}
export function getNodeType(n: YNodeBase) {
  return n.get('type') as NodeType;
}
export function getNodeContent(n: YNodeBase) {
  return n.get('content') as NodeType;
}
export function getNodeStyle(n: YNodeBase) {
  return n.get('style') as Y.Map<string>;
}
export function isRootNode(n: YNode): n is YRootNode {
  return getNodeType(n) === NodeType.Root;
}
export function isImageNode(n: YNode): n is YImageNode {
  return getNodeType(n) === NodeType.Image;
}
export function isTextNode(n: YNode): n is YTextNode {
  return getNodeType(n) === NodeType.Text;
}
export function isBlockNode(n: YNode): n is YBlockNode {
  return getNodeType(n) === NodeType.Block;
}
export function isFragmentNode(n: YNode): n is YFragmentNode {
  return getNodeType(n) === NodeType.Fragment;
}
