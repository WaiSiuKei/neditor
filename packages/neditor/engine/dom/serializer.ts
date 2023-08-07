// This class is responsible for serializing nodes into the provided output
// stream. Note that in the serialization result, the attributes are sorted
// alphabetically, each tag has both opening and closing tag.
import { Node, NodeType, NodeVisitor } from './node';
import type { Element } from './element';
import type { Text } from './text';
import type { Document } from './document';
import type { Comment } from './comment';
import { NOTREACHED } from '@neditor/core/base/common/notreached';

export class Serializer extends NodeVisitor {
  // // Used by the Visit methods. True when Visit is called when entering a Node,
  // // false when leaving.
  private entering_node_: boolean = true;
  private out_stream_: string = '';

  // // Serializes the provided node and its descendants.
  // void Serialize(const scoped_refptr<const Node>& node);
  // // Serializes the provided node, excluding the descendants.
  // void SerializeSelfOnly(const scoped_refptr<const Node>& node);
  // // Serializes the descendants of the provided node, excluding the node itself.
  // void SerializeDescendantsOnly(const scoped_refptr<const Node>& node);

  VisitDocument(d: Document) {
    NOTREACHED();
  }

  VisitElement(e: Element) {
    if (this.entering_node_) {
      this.out_stream_ += '<';
      this.out_stream_ += e.tagName;
      this.out_stream_ = WriteAttributes(e, this.out_stream_);
      this.out_stream_ += '>';
    } else {
      this.out_stream_ += '</';
      this.out_stream_ += e.tagName;
      this.out_stream_ += '>';
    }
  }
  VisitText(t: Text) {
    if (this.entering_node_) {
      this.out_stream_ += t.data;
    }
  }

  SerializeDescendantsOnly(node: Node) {
    let child = node.firstChild;
    while (child) {
      this.Serialize(child);
      child = child.next_sibling();
    }
  }

  Serialize(node: Node) {
    this.entering_node_ = true;
    node.Accept(this);

    this.SerializeDescendantsOnly(node);

    this.entering_node_ = false;
    node.Accept(this);
  }

  SerializeSelfOnly(node: Node) {
    this.entering_node_ = true;
    node.Accept(this);

    if (node.firstChild) {
      this.out_stream_ += '...';
    }

    this.entering_node_ = false;
    node.Accept(this);
  }

  toString(): string {
    return this.out_stream_;
  }
  VisitComment(comment: Comment): void {
    if (this.entering_node_) {
      this.out_stream_ += '<!--';
      this.out_stream_ += comment.data;
      this.out_stream_ += '-->';
    }
  }
}

function WriteAttributes(element: Element, out_stream: string): string {
  let attributes = element.attributes;

  {
    // The "style" attribute is handled specially because HTMLElements store
    // it explicitly as a cssom::CSSDeclaredStyleDeclaration structure instead
    // of as an attribute string, so we add it (or replace it) explicitly in the
    // attribute map.
    const htmlEl = element.AsHTMLElement();
    if (htmlEl) {
      out_stream += ` style="${htmlEl.style.toString()}"`;
    }
  }

  let keys = Array.from(attributes.keys());
  keys.sort((a: string, b: string) => a.localeCompare(b));
  for (let k of keys) {
    let name = k;
    let value = attributes.get(k)!;
    out_stream += ' ';
    out_stream += name;
    if (value.length) {
      out_stream += '=';
      out_stream += '"';
      out_stream += value.toString();
      out_stream += '"';
    }
  }
  return out_stream;
}
