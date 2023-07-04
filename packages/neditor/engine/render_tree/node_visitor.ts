// Type-safe branching on a class hierarchy of render tree nodes,
// implemented after a classical GoF pattern (see
// http://en.wikipedia.org/wiki/Visitor_pattern#Java_example).
import type { CompositionNode } from './composition_node';
import type { ClearRectNode } from './clear_rect_node';
import type { TextNode } from './text_node';
import type { RectNode } from './rect_node';
import type { MatrixTransformNode } from './matrix_transform_node';
import type { ImageNode } from './image_node';
import type { FreehandNode } from './freehand_node';

export abstract class NodeVisitor {
  // abstract Visit(animate: any): void
  // virtual void Visit(ClearRectNode* clear_rect) = 0;
  abstract VisitCompositionNode(composition: CompositionNode): void
  abstract VisitClearRectNode(node: ClearRectNode): void
  // virtual void Visit(FilterNode* text) = 0;
  abstract VisitImageNode(image: ImageNode): void
//  virtual void Visit(LottieNode* lottie) = 0;
//   virtual void Visit(MatrixTransform3DNode* transform) = 0;
  abstract VisitMatrixTransformNode(transform: MatrixTransformNode): void
//  virtual void Visit(PunchThroughVideoNode* punch_through) = 0;
  abstract VisitRectNode(rect: RectNode): void
//   virtual void Visit(RectShadowNode* rect) = 0;
  abstract VisitTextNode(text: TextNode): void
  abstract VisitFreehandNode(node: FreehandNode): void;
}

