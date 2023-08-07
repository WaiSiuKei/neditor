import { Node } from './node';

export abstract class AbstractRange {
  abstract startContainer: Node
  abstract startOffset: number
  abstract endContainer: Node
  abstract endOffset: number
  abstract collapsed: boolean

// static bool HasDifferentRootContainer(Node* start_root_container,
//     Node* end_root_container);
// static unsigned LengthOfContents(const Node*);
//   virtual bool IsStaticRange() const = 0;
//   virtual Document& OwnerDocument() const = 0;
}
