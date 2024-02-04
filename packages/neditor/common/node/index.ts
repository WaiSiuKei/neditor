import { IBlockRecord, IRootRecord, ITextRecord } from '../record';

export interface ITypedNode {
  isDescendant(): this is IDescendantNode;
  isAncestor(): this is IAncestorNode;
  insertBefore(ref: IDescendantNode): void;
  insertAfter(ref: IDescendantNode): void;
  remove(): void;
  parent: IAncestorNode | undefined;
  attach(): void;
  detach(): void;
}
export interface IAsAncestor extends ITypedNode {
  children: IDescendantNode[];
  appendChildren(...toAdd: IDescendantNode[]): void;
}
export interface IAsDescendant extends ITypedNode {
}

export interface IRootNode extends IRootRecord, IAsAncestor {
}

export interface IBlockNode extends IBlockRecord, IAsAncestor, IAsDescendant {
}

export interface ITextNode extends ITextRecord, IAsDescendant {
}

export type IModelNode =
  | IBlockNode
  | ITextNode
  | IRootNode

export type IDescendantNode =
  | ITextNode
  | IBlockNode

export type IAncestorNode =
  | IRootNode
  | IBlockNode
