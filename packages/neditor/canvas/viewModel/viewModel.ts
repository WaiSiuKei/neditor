import { IIdentifier } from '../../common/common';
import { IStyleDeclaration } from '../../common/style';
import { IDisposable } from '../../base/common/lifecycle';
import { Event } from '../../base/common/event';
import { ScopedIdentifier } from '../canvasCommon/scope';
import { Optional } from '../../base/common/typescript';
import { DCHECK } from '../../base/check';
import { NodeType } from '../../common/node';

export interface IRootNodeViewModel {
  type: NodeType.Root;
  id: IIdentifier;
  children: INodeViewModel[];
  style?: IStyleDeclaration;
  attrs: Record<string, any>
}

export interface IBlockNodeViewModel {
  type: NodeType.Block;
  id: IIdentifier;
  children: INodeViewModel[];
  style: IStyleDeclaration;
  attrs: Record<string, any>
  fragment?: INodeViewModel;
  isFragmentPlaceholder?: boolean;
}

export interface ITextNodeViewModel {
  type: NodeType.Text;
  id: IIdentifier;
  style: IStyleDeclaration;
  content: string;
  attrs: Record<string, any>
}

export function assertIsIBlockNodeViewModel(n: INodeViewModel): asserts n is IBlockNodeViewModel {
  DCHECK(isIBlockNodeViewModel(n));
}
export function assertIsIRootNodeViewModel(n: INodeViewModel): asserts n is IRootNodeViewModel {
  DCHECK(isIRootNodeViewModel(n));
}

export function isIBlockNodeViewModel(n: INodeViewModel): n is IBlockNodeViewModel {
  return n.type === NodeType.Block;
}
export function isIRootNodeViewModel(n: INodeViewModel): n is IRootNodeViewModel {
  return n.type === NodeType.Root;
}
export function isITextNodeViewModel(n: INodeViewModel): n is ITextNodeViewModel {
  return n.type === NodeType.Text;
}

export type INodeViewModel = IBlockNodeViewModel | ITextNodeViewModel | IRootNodeViewModel

export interface ICanvasViewModel extends IDisposable {
  onReconnected: Event<void>;
  readonly root: { value: IRootNodeViewModel };
  getViewModelNodeById(id: ScopedIdentifier): Optional<INodeViewModel>;

  internal_disconnect(resourceStr: string): void;
  internal_connect(resourceStr: string, emitEvent?: boolean): void;
}
