import { IBlockRecord, IRootRecord, ITextRecord } from '../record';
import { ITypedRecord } from '../record/types/base';

export interface ITypedNode extends ITypedRecord {
  isDescendant(): this is IDescendantNode;
  isAncestor(): this is IAncestorNode;
  insertBefore(ref: IDescendantNode): void;
  insertAfter(ref: IDescendantNode): void;
  remove(): void;
  parent: IAncestorNode | undefined;
  children: IDescendantNode[];
  attach(): void;
  detach(): void;
}
export interface IAsAncestor extends Omit<ITypedNode, 'type'> {
  appendChildren(...toAdd: IDescendantNode[]): void;
}
export interface IAsDescendant extends Omit<ITypedNode, 'type'> {
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
