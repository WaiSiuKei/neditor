import { ConstructionType, NodeType, NodeVisitor } from './node';
import type { Document } from './document';
import { CharacterData } from './character_data';
import { AttachContext } from './attach_context';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { isString } from '@neditor/core/base/common/type';

// The Text interface represents the textual content of Element or Attr.
//   https://www.w3.org/TR/2014/WD-dom-20140710/#interface-text
export class Text extends CharacterData {
  constructor(data: string)
  constructor(document: Document, data: string)
  constructor(a1: Document | string, a2?: string) {
    if (isString(a1)) {
      super(ConstructionType.kCreateText, a1);
    } else {
      super(ConstructionType.kCreateText, a1 as Document, a2!);
    }
  }

  // Web API: Node

  get nodeName() {return '#text';}
  getNodeType() { return NodeType.kTextNode; }

  // Custom, not in any spec: Node.
  //
  AsText() { return this; }

  Accept(visitor: NodeVisitor) {
    visitor.VisitText(this);
  }

  Duplicate() {
    let t = new Text(this.data);
    t.node_document_ = this.node_document_;
    return t;
  }
}
