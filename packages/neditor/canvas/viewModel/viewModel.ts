import { IIdentifier } from '../../common/common';
import { IStyleDeclaration } from '../../common/style';
import { IDisposable } from '../../base/common/lifecycle';
import { Event } from '../../base/common/event';
import { ScopedIdentifier } from '../canvasCommon/scope';
import { Optional } from '../../base/common/typescript';
import { NodeType } from '../../common/node';

export interface IRootNodeViewModel {
  type: NodeType.Root;
  id: IIdentifier;
  children: INodeViewModel[];
  style?: IStyleDeclaration;
  attrs: Record<string, any>;
}

export interface IBlockNodeViewModel {
  type: NodeType.Block;
  id: IIdentifier;
  children: INodeViewModel[];
  style: IStyleDeclaration;
  attrs: Record<string, any>;
  fragment?: INodeViewModel;
  isFragmentPlaceholder?: boolean;
}

export interface ITextNodeViewModel {
  type: NodeType.Text;
  id: IIdentifier;
  style: IStyleDeclaration;
  content: string;
  attrs: Record<string, any>;
}

export interface IImageNodeViewModel {
  type: NodeType.Image;
  id: IIdentifier;
  style: IStyleDeclaration;
  // content: string;
  attrs: Record<string, any>;
}

export function isBlockNodeViewModel(n: INodeViewModel): n is IBlockNodeViewModel {
  return n.type === NodeType.Block;
}
export function isRootNodeViewModel(n: INodeViewModel): n is IRootNodeViewModel {
  return n.type === NodeType.Root;
}
export function isTextNodeViewModel(n: INodeViewModel): n is ITextNodeViewModel {
  return n.type === NodeType.Text;
}

export type INodeViewModel = IBlockNodeViewModel | ITextNodeViewModel | IRootNodeViewModel | IImageNodeViewModel

export interface ICanvasViewModel extends IDisposable {
  onReconnected: Event<void>;
  readonly root: { value: IRootNodeViewModel };
  getViewModelNodeById(id: ScopedIdentifier): Optional<INodeViewModel>;

  internal_disconnect(resourceStr: string): void;
  internal_connect(resourceStr: string, emitEvent?: boolean): void;
}
