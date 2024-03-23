import { Rect } from '../../../base/common/geometry/rect';
import { createDecorator } from '../../instantiation/common/instantiation';
import { ILayoutObject } from '../../layout/common/layout';
import { NodeVisitor } from './nodeVisitor';
import type { ClearRectNode } from './types/clearRectNode';
import type { CompositionNode } from './types/compositionNode';
import type { ImageNode } from './types/imageNode';
import type { MatrixTransformNode } from './types/matrixTransformNode';
import type { RectNode } from './types/rectNode';
import type { TextNode } from './types/textNode';

export const IRenderTreeService = createDecorator<IRenderTreeService>('layoutService');

export interface IRenderTreeService {
  _serviceBrand: undefined;

  bind(layoutTree: ILayoutObject): void;
}

export interface IRenderTreeNode {
  accept(visitor: NodeVisitor): void;
  getBounds(): Rect;
}

export interface IRenderTreeNodeVisitor {
  VisitCompositionNode(composition: CompositionNode): void;
  VisitClearRectNode(node: ClearRectNode): void;
  VisitImageNode(image: ImageNode): void;
  VisitMatrixTransformNode(transform: MatrixTransformNode): void;
  VisitRectNode(rect: RectNode): void;
  VisitTextNode(text: TextNode): void;
}
