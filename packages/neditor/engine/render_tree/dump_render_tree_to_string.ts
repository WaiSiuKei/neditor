// Returns a string that is a serialized text representation of the render tree.
// The string does not contain all of the information present within the input
// tree, but rather information that was [subjectively] deemed relevant to
// debugging it.
import { Node } from './node';
import { NodeVisitor } from './node_visitor';
import type { ClearRectNode } from './clear_rect_node';
import type { CompositionNode } from './composition_node';
import type { MatrixTransformNode } from './matrix_transform_node';
import type { RectNode } from './rect_node';
import type { TextNode } from './text_node';
import type { LinearGradientBrush, RadialGradientBrush, SolidColorBrush } from './brush';
import { BrushVisitor } from './brush_visitor';
import type { ImageNode } from './image_node';
import { FreehandNode } from './freehand_node';

// A render tree visitor that accumulates node dumps to text within a
// std::ostringstream object.
export class DebugTreePrinter extends NodeVisitor {
  // The results object in which we accumulate our string representation.
  private result_ = '';

  // Our current indent when printing lines of information.
  private indent_ = 0;

  VisitClearRectNode(clear_rect: ClearRectNode): void {
    this.AddNamedNodeString(clear_rect, 'ClearRectNode');
    this.result_ += '\n';
  }
  VisitCompositionNode(composition: CompositionNode): void {
    this.AddNamedNodeString(composition, 'CompositionNode');
    this.result_ += '\n';

    this.indent_++;

    let children = composition.data().children();
    for (let node of children) {
      node.Accept(this);
    }
    this.indent_--;
  }
  VisitMatrixTransformNode(transform: MatrixTransformNode): void {
    this.AddNamedNodeString(transform, 'MatrixTransformNode');
    this.result_ += '\n';

    this.indent_++;

    transform.data().source.Accept(this);
    this.indent_--;
  }
  VisitRectNode(rect: RectNode): void {
    this.AddNamedNodeString(rect, 'RectNode ');
    if (rect.data().background_brush) {
      let printer_brush_visitor = new BrushPrinterVisitor();
      rect.data().background_brush!.Accept(printer_brush_visitor);
      this.result_ += printer_brush_visitor.brush_type();
    }
    this.result_ += '\n';
  }
  VisitTextNode(text: TextNode): void {
    this.AddNamedNodeString(text, 'TextNode');
    this.result_ += '\n';
  }
  VisitFreehandNode(node: FreehandNode) {
    this.AddNamedNodeString(node, 'FreehandNode');
    this.result_ += '\n';
  }
  // Returns the final result after visitation is complete.
  Result() { return this.result_; }
  private AddNamedNodeString(node: Node, type_name: string) {
    this.AddIndentString();
    this.result_ += type_name;
    this.result_ += ' ';
    this.AddNodeInfoString(node);
  }
  // Adds an appropriate number of indent characters according to |indent_|.
  private AddIndentString() {
    this.result_ += (new Array(this.indent_ * 2)).fill(' ').join('');
  }
  private AddNodeInfoString(node: Node) {
    let bounds = node.GetBounds();

    this.result_ += '{ Bounds: (';
    this.result_ += bounds.x();
    this.result_ += ', ';
    this.result_ += bounds.y();
    this.result_ += ', ';
    this.result_ += bounds.width();
    this.result_ += ', ';
    this.result_ += bounds.height();
    this.result_ += ') }';
  }
  VisitImageNode(image: ImageNode): void {
    this.AddNamedNodeString(image, 'ImageNode');
    this.result_ += '\n';
  }
}

class BrushPrinterVisitor extends BrushVisitor {
  brush_type() { return this.brush_type_; }

  private brush_type_: string = '';
  visitLinearGradientBrush(linear_gradient_brush: LinearGradientBrush): void {
    this.brush_type_ = '(LinearGradientBrush)';

  }
  visitRadialGradientBrush(radial_gradient_brush: RadialGradientBrush): void {
    this.brush_type_ = '(RadialGradientBrush)';
  }
  visitSolidColorBrush(solid_color_brush: SolidColorBrush): void {
    this.brush_type_ = '(SolidColorBrush)';
  }
};

export function DumpRenderTreeToString(node: Node) {
  let tree_printer = new DebugTreePrinter();
  node.Accept(tree_printer);

  return tree_printer.Result();
}
