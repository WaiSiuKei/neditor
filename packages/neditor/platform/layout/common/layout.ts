import { createDecorator } from '@neditor/core/platform/instantiation/common/instantiation';
import { IDisposable } from '../../../base/common/lifecycle';
import { ITypedNode } from '../../../common/node';
import { IDocumentModel } from '../../model/common/model';

export const ILayoutService = createDecorator<ILayoutService>('layoutService');

export interface ILayoutService extends IDisposable {
  readonly _serviceBrand: undefined;
  // pushCallStack(): boolean;
  // popCallStack(): boolean;
  // resetCallStack(): void;
  bind(model: IDocumentModel): void;
  // loadAlgorithms(): Promise<void>;
  algorithms: ILayoutAlgorithm[];
  // layoutTrees: Map<string, ILayoutObject>;
  // commitLayout(l: ILayoutObject,
  //              data: Partial<LayoutData>): void;
}

export interface ILayoutAlgorithm {
  type: string;
  interestedKeys: Array<string>;
  isLayoutContainer(model: ITypedNode): boolean;
  isLayoutItem(model: ITypedNode): boolean;
  rebuildStructures(layoutObjects: ILayoutObject[]): void;
  destroyStructures(layoutObjects: ILayoutObject[]): void;
  layout(layoutObjects: ILayoutObject[]): void;
  load(): Promise<void>;
  loaded: boolean;
  dumpCalculationTree(root: ILayoutObject): string;
}
export interface ILayoutObject extends IDisposable {
  model: ITypedNode;
  children: ILayoutObject[];
  parent: ILayoutObject | null;
  getIsLayoutContainer(type: string): boolean | undefined;
  getIsLayoutItem(type: string): boolean | undefined;
  getNode<T>(type: string): T;
  hasNode(type: string): boolean;
  setNode<T>(type: string,
             val: T): void;
  deleteNode(type: string): void;
  resetStructureDirty(type: string): void;
  resetLayoutDirty(type: string): void;
}

export interface LayoutData {
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface BoxModel extends LayoutData {

}
export interface LayoutDeclarations extends BoxModel {
  [key: string]: any;
}
