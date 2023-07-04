import { DCHECK } from '@neditor/core/base/check';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { assertIsDefined } from '@neditor/core/base/common/type';
import { Optional } from '@neditor/core/base/common/typescript';
import { ComparePositionsInDOMTree } from '../editing/editing_utilities';
import { AbstractRange } from './abstract_range';
import { Document } from './document';
import { DOMException } from './dom_exception';
import { DOMExceptionCode } from './exception_code';
import { Node, NodeType } from './node';
import { NodeTraversal } from './node_traversal';
import { RangeBoundaryPoint } from './range_boundary_point';

export class Range extends AbstractRange {
  private start_: RangeBoundaryPoint;
  private end_: RangeBoundaryPoint;

  static createFromDoc(doc: Document) {
    return new Range(doc, doc, 0, doc, 0);
  }

  constructor(
    owner_document: Document,
    start_container: Node,
    start_offset: number,
    end_container: Node,
    end_offset: number) {
    super();

    this.start_ = new RangeBoundaryPoint(owner_document);
    this.end_ = new RangeBoundaryPoint(owner_document);

    this.setStart(start_container, start_offset);
    this.setEnd(end_container, end_offset);
  }
  collapsed(): boolean {
    return this.start_.EQ(this.end_);
  }
  endContainer(): Node {
    return this.end_.Container();
  }
  endOffset(): number {
    return this.end_.Offset();
  }
  startContainer(): Node {
    return this.start_.Container();
  }
  startOffset(): number {
    return this.start_.Offset();
  }

  setStart(ref_node: Node,
           offset: number) {
    DCHECK(ref_node);

    let child_node = this.CheckNodeWOffset(ref_node, offset);

    this.start_.Set(ref_node, offset, child_node);

    // if (did_move_document ||
    // HasDifferentRootContainer(&start_.Container(), &end_.Container()) ||
    // compareBoundaryPoints(start_, end_, ASSERT_NO_EXCEPTION) > 0)
    // collapse(true);
    // }
    if (this.compareBoundaryPointInstances(this.start_, this.end_) > 0) {
      this.collapse(true);
    }
  }

  setEnd(ref_node: Node,
         offset: number,
  ) {
    //   if (!ref_node) {
    //   // FIXME: Generated bindings code never calls with null, and neither should
    //   // other callers!
    //   exception_state.ThrowTypeError("The node provided is null.");
    //   return;
    // }

    // bool did_move_document = false;
    // if (ref_node->GetDocument() != owner_document_) {
    //   SetDocument(ref_node->GetDocument());
    //   did_move_document = true;
    // }

    let child_node = this.CheckNodeWOffset(ref_node, offset);
    // if (exception_state.HadException())
    //   return;

    this.end_.Set(ref_node, offset, child_node);

    // if (did_move_document ||
    // HasDifferentRootContainer(&start_.Container(), &end_.Container()) ||
    // compareBoundaryPoints(start_, end_, ASSERT_NO_EXCEPTION) > 0)
    // collapse(false);
    if (this.compareBoundaryPointInstances(this.start_, this.end_) > 0) {
      this.collapse(false);
    }
  }

  collapse(to_start: boolean) {
    if (to_start)
      this.end_ = this.start_.CLONE();
    else
      this.start_ = this.end_.CLONE();
  }

  CheckNodeWOffset(n: Node,
                   offset: number,
  ): Optional<Node> {
    switch (n.getNodeType()) {
      case NodeType.kCommentNode:
      case NodeType.kTextNode:
        if (offset > assertIsDefined(n.AsCharacterData()).length()) {
          debugger;
          throw new DOMException('The offset ' + (offset) +
            ' is larger than the node\'s length (' +
            assertIsDefined(n.AsCharacterData()).length() + ').', DOMExceptionCode.kIndexSizeError);
        } else if (offset > Number.MAX_SAFE_INTEGER) {
          throw new DOMException('The offset ' + offset + ' is invalid.', DOMExceptionCode.kIndexSizeError);
        }
        return undefined;
      case NodeType.kDocumentNode:
      case NodeType.kElementNode: {
        if (!offset)
          return undefined;
        if (offset > Number.MAX_SAFE_INTEGER) {
          throw new DOMException('The offset ' + offset + ' is invalid.', DOMExceptionCode.kIndexSizeError);
        }
        let child_before = NodeTraversal.ChildAt(n, offset - 1);
        if (!child_before) {
          NOTREACHED();
          //   exception_state.ThrowDOMException(
          //     DOMExceptionCode::kIndexSizeError,
          //     "There is no child at offset " + String::Number(offset) + ".");
        }
        return child_before;
      }
    }
    NOTREACHED();
    return undefined;
  }

  compareBoundaryPointInstances(boundary_a: RangeBoundaryPoint,
                                boundary_b: RangeBoundaryPoint,): number {
    return this.compareBoundaryPointsValues(boundary_a.Container(), boundary_a.Offset(),
      boundary_b.Container(), boundary_b.Offset(),);
  }

  compareBoundaryPointsValues(container_a: Node,
                              offset_a: number,
                              container_b: Node,
                              offset_b: number,) {
    // let disconnected = false;
    let result = ComparePositionsInDOMTree(container_a, offset_a, container_b, offset_b);
    // if (disconnected) {
    //   exception_state.ThrowDOMException(
    //     DOMExceptionCode::kWrongDocumentError,
    //     'The two ranges are in separate documents.');
    //   return 0;
    // }
    return result;
  }

}
