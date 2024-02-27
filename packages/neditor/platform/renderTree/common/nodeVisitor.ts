import type { ClearRectNode } from './types/clearRectNode';
import type { CompositionNode } from './types/compositionNode';
import type { ImageNode } from './types/imageNode';
import type { MatrixTransformNode } from './types/matrixTransformNode';
import type { RectNode } from './types/rectNode';
import type { TextNode } from './types/textNode';

export abstract class NodeVisitor {
  // abstract Visit(animate: any): void
  abstract VisitCompositionNode(composition: CompositionNode): void
  abstract VisitClearRectNode(node: ClearRectNode): void
  // virtual void Visit(FilterNode* text) = 0;
  abstract VisitImageNode(image: ImageNode): void
//  virtual void Visit(LottieNode* lottie) = 0;
  abstract VisitMatrixTransformNode(transform: MatrixTransformNode): void
  abstract VisitRectNode(rect: RectNode): void
//   virtual void Visit(RectShadowNode* rect) = 0;
  abstract VisitTextNode(text: TextNode): void
}

