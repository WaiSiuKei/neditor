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
  type: NodeType.Text;
  from: IIdentifier;
  order: string;
  style: Partial<InlineLevelMarks> & Partial<BlockLevelMarks> & IInlineStyle;
  content: string;
}

export interface IBlockNodeModel {
  id: IIdentifier;
  type: NodeType.Block;
  from: IIdentifier;
  order: string;
  style: Partial<BlockLevelMarks> & IInlineStyle;
}

export interface IFragmentNodeModel {
  id: IIdentifier;
  type: NodeType.Fragment;
  from: IIdentifier;
  order: string;
  //
  fragment: IIdentifier;
  // ts-happy
  style?: any;
}

export interface IRootNodeModel {
  id: IIdentifier;
  type: NodeType.Root;
  // ts-happy
  from?: any;
  order?: any;
  style?: any;
}

export type INodeModel = ITextNodeModel | IBlockNodeModel | IRootNodeModel | IFragmentNodeModel

export function isIBlockNodeModel(n: INodeModel): n is IBlockNodeModel {
  return n.type === NodeType.Block;
}

export function isIRootNodeModel(n: INodeModel): n is IRootNodeModel {
  return n.type === NodeType.Root;
}

export function isITextNodeModel(n: INodeModel): n is ITextNodeModel {
  return n.type === NodeType.Text;
}

export function isFragmentNode(node: INodeModel): boolean {
  return node.type === NodeType.Fragment;
}
