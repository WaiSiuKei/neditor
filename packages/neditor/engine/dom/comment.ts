// The Comment interface represents textual notations within markup; although
// it is generally not visually shown, such comments can be still retrieved
// from the document.
//   https://www.w3.org/TR/2014/WD-dom-20140710/#interface-comment
import { CharacterData } from './character_data';
import type { NodeVisitor } from './node';
import { ConstructionType, NodeType } from './node';
import { Document } from './document';
import { isString } from '@neditor/core/base/common/type';

export class Comment extends CharacterData {
  constructor(data: string)
  constructor(document: Document, data: string)
  constructor(a1: Document | string, a2?: string) {
    if (isString(a1)) {
      super(ConstructionType.kCreateOther, a1);
    } else {
      super(ConstructionType.kCreateOther, a1 as Document, a2!);
    }
  }
  // Web API: Node
  get nodeName() {return '#comment';}
  getNodeType() { return NodeType.kCommentNode; }

  // Custom, not in any spec: Node.
  //
  AsComment() { return this; }

  Accept(visitor: NodeVisitor) {
    visitor.VisitComment(this);
  }

  Duplicate() {
    let c = new Comment(this.data);
    c.node_document_ = this.node_document_;
    return c;
  }
};
