import * as Y from 'yjs';
import { DCHECK } from '../base/check';
import { NOTIMPLEMENTED } from '../base/common/notreached';
import { isString } from '../base/common/type';
import { EnumAndLiteral, Optional, ValueOf } from '../base/common/typescript';
import { IIdentifier } from './common';
import { IBlockStyleDeclaration, IInlineStyleDeclaration, IStyleDeclaration } from './style';

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

const proxyHandler: ProxyHandler<ReturnType<typeof getNodeStyle>> = {
  get(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): any {
    if (!isString(p)) NOTIMPLEMENTED();
    return target.get(p);
  },
  set(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration, value: ValueOf<Required<IStyleDeclaration>>): boolean {
    if (!isString(p)) NOTIMPLEMENTED();
    target.set(p, value);
    return true;
  },
  has(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): boolean {
    if (!isString(p)) NOTIMPLEMENTED();
    return target.has(p);
  },
  deleteProperty(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): boolean {
    if (!isString(p)) NOTIMPLEMENTED();
    target.delete(p);
    return true;
  },
  ownKeys(target: ReturnType<typeof getNodeStyle>): ArrayLike<keyof IStyleDeclaration> {
    return Array.from(target.keys()) as unknown as ArrayLike<keyof IStyleDeclaration>;
  }
};

class ChildNodeProxy {
  readonly id: IIdentifier;
  constructor(
    public y: YNode,
  ) {
    this.id = getNodeId(y);
  }

  get from(): IIdentifier {
    return getNodeFrom(this.y);
  }
  set from(val) {
    this.y.set('from', val);
  }
  get order(): string {
    return getNodeOrder(this.y);
  }
  set order(val) {
    this.y.set('order', val);
  }
}

export class RoolNodeModelProxy extends ChildNodeProxy implements IRootNodeModel {
  type: EnumAndLiteral<NodeType.Root> = NodeType.Root;
  constructor(
    y: YNode,
  ) {
    super(y);
    const type = getNodeType(y);
    DCHECK(type === NodeType.Root);
  }
}

export class BlockNodeModelProxy extends ChildNodeProxy implements IBlockNodeModel {
  readonly style: IBlockStyleDeclaration;
  type: EnumAndLiteral<NodeType.Block> = NodeType.Block;
  constructor(
    y: YNode,
  ) {
    super(y);
    const type = getNodeType(y);
    DCHECK(type === NodeType.Block);
    this.style = new Proxy(getNodeStyle(y), proxyHandler) as unknown as IBlockStyleDeclaration;
  }
}

export function isBlockNodeModelProxy(val: any): val is BlockNodeModelProxy {
  return val instanceof BlockNodeModelProxy;
}

export class TextNodeModelProxy extends ChildNodeProxy implements ITextNodeModel {
  readonly style: IBlockStyleDeclaration;
  type: EnumAndLiteral<NodeType.Text> = NodeType.Text;
  constructor(
    y: YNode,
  ) {
    super(y);
    const type = getNodeType(y);
    DCHECK(type === NodeType.Text);
    this.style = new Proxy(getNodeStyle(y), proxyHandler) as unknown as IInlineStyleDeclaration;
  }
  get content(): string {
    return getNodeContent(this.y);
  }
  set content(val) {
    this.y.set('content', val);
  }
}

export function isTextNodeModelProxy(val: any): val is TextNodeModelProxy {
  return val instanceof TextNodeModelProxy;
}

export type NodeModelProxy = RoolNodeModelProxy | BlockNodeModelProxy | TextNodeModelProxy

export function toProxy(y: YNode): NodeModelProxy {
  const type = getNodeType(y);
  if (type === NodeType.Root) {
    return new RoolNodeModelProxy(y);
  }
  if (type === NodeType.Block) {
    return new BlockNodeModelProxy(y);
  }
  if (type === NodeType.Text) {
    return new TextNodeModelProxy(y);
  }
  NOTIMPLEMENTED();
}
export function toOptionalProxy(y: Optional<YNode>): Optional<NodeModelProxy> {
  if (!y) return undefined;
  return toProxy(y);
}
