import { DCHECK } from '@neditor/core/base/check';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
// import { LayoutObject } from '../blink/layout/layout_object';
// import { ComputedStyle } from '../blink/style/computed_style';
// import { PseudoId } from '../blink/style/computed_style_base_constants';
import { assertIsDefined } from '@neditor/core/base/common/type';
import { Optional } from '@neditor/core/base/common/typescript';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { LayoutObject } from '../layout/layout_object';
import type { CharacterData } from './character_data';
import type { Comment } from './comment';
import { SubtreeModificationAction } from './container_action';
import type { ContainerNode } from './container_node';
import type { Document } from './document';
import type { Element } from './element';
import { NodeDescendantsIterator } from './node_descendants_iterator';
import { NodeList } from './node_list';
import { NodeListLive } from './node_list_live';
import type { Text } from './text';

export enum NodeType {
  kElementNode = 1,
  kTextNode = 3,
  // kCdataSectionNode = 4,
  kCommentNode = 8,
  kDocumentNode = 9,
  // kDocumentTypeNode = 10,
}

// Custom, not in any spec.
// Node generation constants.
export enum NodeGeneration {
  kInvalidNodeGeneration = 0,
  kInitialNodeGeneration = 1,
}

export abstract class NodeVisitor {
  abstract VisitElement(e: Element): void;
  abstract VisitDocument(d: Document): void;
  abstract VisitText(t: Text): void;
  abstract VisitComment(c: Comment): void
}

const kDOMNodeTypeShift = 2;
const kElementNamespaceTypeShift = 4;
const kNodeStyleChangeShift = 15;
const kNodeCustomElementShift = 17;

// Values for kChildNeedsStyleRecalcFlag, controlling whether a node gets its
// style recalculated.
enum StyleChangeType {
  // This node does not need style recalculation.
  kNoStyleChange = 0,
  // This node needs style recalculation.
  kLocalStyleChange = (1 << kNodeStyleChangeShift),
  // This node and all of its flat-tree descendeants need style recalculation.
  kSubtreeStyleChange = (2 << kNodeStyleChangeShift)
};

// Whether or not to force creation of a legacy layout object (i.e. disallow
// LayoutNG).
export enum LegacyLayout {
  // Allow LayoutNG, if nothing else is preventing it (runtime feature disabled,
  // specific object type not yet implemented, Element says no, etc.)
  kAuto,

  // Force legacy layout object creation.
  kForce
};

enum NodeFlags {
  kHasRareDataFlag = 1,

  // Node type flags. These never change once created.
  kIsContainerFlag = 1 << 1,
  kDOMNodeTypeMask = (0x3 << kDOMNodeTypeShift),
  kElementNamespaceTypeMask = (0x3 << kElementNamespaceTypeShift),

  // Changes based on if the element should be treated like a link,
  // ex. When setting the href attribute on an <a>.
  kIsLinkFlag = 1 << 6,

  // Changes based on :hover, :active and :focus state.
  kIsUserActionElementFlag = 1 << 7,

  // Tree state flags. These change when the element is added/removed
  // from a DOM tree.
  kIsConnectedFlag = 1 << 8,
  kIsInShadowTreeFlag = 1 << 9,

  // Set by the parser when the children are done parsing.
  kIsFinishedParsingChildrenFlag = 1 << 10,

  // Flags related to recalcStyle.
  kHasCustomStyleCallbacksFlag = 1 << 11,
  kChildNeedsStyleInvalidationFlag = 1 << 12,
  kNeedsStyleInvalidationFlag = 1 << 13,
  kChildNeedsStyleRecalcFlag = 1 << 14,
  kStyleChangeMask = (0x3 << kNodeStyleChangeShift),

  kCustomElementStateMask = (0x7 << kNodeCustomElementShift),

  kHasNameOrIsEditingTextFlag = 1 << 20,
  kHasEventTargetDataFlag = 1 << 21,

  kNeedsReattachLayoutTree = 1 << 22,
  kChildNeedsReattachLayoutTree = 1 << 23,

  kHasDuplicateAttributes = 1 << 24,

  kForceReattachLayoutTree = 1 << 25,

  kHasDisplayLockContext = 1 << 26,

  kSelfOrAncestorHasDirAutoAttribute = 1 << 27,
  kCachedDirectionalityIsRtl = 1 << 28,
  kNeedsInheritDirectionalityFromParent = 1 << 29,

  kDefaultNodeFlags = kIsFinishedParsingChildrenFlag,

  // 3 bits remaining.
};

enum DOMNodeType {
  kElement = 0,
  kText = (1 << kDOMNodeTypeShift),
  kDocumentFragment = (2 << kDOMNodeTypeShift),
  kOther = (3 << kDOMNodeTypeShift),
}

enum ElementNamespaceType {
  kHTML = 0,
  kMathML = (1 << kElementNamespaceTypeShift),
  kSVG = (2 << kElementNamespaceTypeShift),
  kOther = (3 << kElementNamespaceTypeShift),
};

export enum ConstructionType {
  kCreateNone = 0,
  kCreateOther = NodeFlags.kDefaultNodeFlags |
    (DOMNodeType.kOther) |
    (ElementNamespaceType.kOther),
  kCreateText = NodeFlags.kDefaultNodeFlags |
    (DOMNodeType.kText) |
    (ElementNamespaceType.kOther),
  kCreateContainer = NodeFlags.kDefaultNodeFlags | NodeFlags.kIsContainerFlag |
    (DOMNodeType.kOther) |
    (ElementNamespaceType.kOther),
  kCreateElement = NodeFlags.kDefaultNodeFlags | NodeFlags.kIsContainerFlag |
    (DOMNodeType.kElement) |
    (ElementNamespaceType.kOther),
  kCreateDocumentFragment =
    NodeFlags.kDefaultNodeFlags | NodeFlags.kIsContainerFlag |
    (DOMNodeType.kDocumentFragment) |
    (ElementNamespaceType.kOther),
  kCreateShadowRoot = kCreateDocumentFragment | NodeFlags.kIsInShadowTreeFlag,
  kCreateHTMLElement = NodeFlags.kDefaultNodeFlags | NodeFlags.kIsContainerFlag |
    (DOMNodeType.kElement) |
    (ElementNamespaceType.kHTML),
  kCreateMathMLElement =
    NodeFlags.kDefaultNodeFlags | NodeFlags.kIsContainerFlag |
    (DOMNodeType.kElement) |
    (ElementNamespaceType.kMathML),
  kCreateSVGElement = NodeFlags.kDefaultNodeFlags | NodeFlags.kIsContainerFlag |
    (DOMNodeType.kElement) |
    (ElementNamespaceType.kSVG),
  kCreateDocument = kCreateContainer | NodeFlags.kIsConnectedFlag,
  kCreateEditingText = kCreateText | NodeFlags.kHasNameOrIsEditingTextFlag,
};

export abstract class Node {
  protected parent_: Optional<ContainerNode>;
  protected first_child_: Optional<Node>;
  protected last_child_: Optional<Node>;
  protected next_sibling_: Optional<Node>;
  protected previous_sibling_: Optional<Node>;
  protected node_document_: Optional<Document>;
  protected inserted_into_document_: boolean = false;
  protected node_value_: Optional<string>;

  protected node_generation_: number = NodeGeneration.kInitialNodeGeneration;

  protected node_flags_: number = ConstructionType.kCreateNone;
  private layout_object_!: LayoutObject;

  constructor(type: ConstructionType)
  constructor(type: ConstructionType, document: Document)
  constructor(type: ConstructionType, arg?: any) {
    this.node_flags_ = type;
    if (arg) {
      this.node_document_ = arg as Document;
    }
    // DCHECK(this.node_document_);
  }

  abstract Accept(visitor: NodeVisitor): void
  IsDocument(): this is Document {
    return this.getNodeType() === NodeType.kDocumentNode;
  }
  IsElement(): this is Element {
    return this.getNodeType() === NodeType.kElementNode;
  }
  IsText(): this is Text {
    return this.getNodeType() === NodeType.kTextNode;
  }

  isConnected() {
    return this.inserted_into_document_;
  }

  abstract getNodeType(): NodeType
  get nodeType() {
    return this.getNodeType();
  }
  abstract get nodeName(): string;
  get nodeValue() {
    return this.node_value_;
  }
  set nodeValue(val: Optional<string>) {
    // By default, setting nodeValue has no effect.
  }
  get firstChild() {
    return this.first_child_;
  }
  get lastChild() {
    return this.last_child_;
  }
  next_sibling(): Optional<Node> {
    return this.next_sibling_;
  }
  get nextSibling() {
    return this.next_sibling();
  }
  previous_sibling(): Optional<Node> {
    return this.previous_sibling_;
  }
  get previousSibling() {
    return this.previous_sibling();
  }

  SetPreviousSibling(previous: Optional<Node>) {
    this.previous_sibling_ = previous;
  }
  SetNextSibling(next: Optional<Node>) {
    this.next_sibling_ = next;
  }

  get childNodes() {
    return NodeListLive.CreateWithChildren(this);
  }

  get parentElement(): Optional<Element> {
    return this.parent_?.AsElement();
  }
  get parentNode(): Optional<ContainerNode> {
    return this.parent_;
  }
  SetParentNode(parent: Optional<ContainerNode>) {
    this.parent_ = parent;
  }

  GetDocument() {
    return this.node_document_;
  }

  compareDocumentPosition(toCompare: Node): number {
    return NOTIMPLEMENTED();
  }

  AsComment(): Optional<Comment> {
    return undefined;
  }
  AsText(): Optional<Text> {
    return undefined;
  }
  AsElement(): Optional<Element> {
    return undefined;
  }
  AsCharacterData(): Optional<CharacterData> {
    return undefined;
  }
  AsContainerNode(): Optional<ContainerNode> {
    return undefined;
  }
  get textContent(): Optional<string> {
    // This covers ProcessingInstruction and Comment that should return their
    // value when .textContent is accessed on them, but should be ignored when
    // iterated over as a descendant of a ContainerNode.
    let t = this.AsText();
    if (t) {
      return t.data;
    }
    let c = this.AsComment();
    if (c) {
      return c.data;
    }

    // Documents and non-container nodes (that are not CharacterData)
    // have null textContent.
    if (this.IsDocument())
      return '';

    let content = '';

    let child = this.firstChild;
    while (child) {
      if (child.IsText() || child.IsElement()) {
        content += (child.textContent || '');
      }
      child = child.next_sibling();
    }

    return content;
  }

  // https://source.chromium.org/chromium/chromium/src/+/refs/tags/116.0.5808.2:third_party/blink/renderer/core/dom/node.cc;l=2038
  set textContent(text: Optional<string>) {
    text = text || '';
    switch (this.getNodeType()) {
      case NodeType.kTextNode:
      case NodeType.kCommentNode:
        this.nodeValue = text;
        return;
      case NodeType.kElementNode: {
        // FIXME: Merge this logic into replaceChildrenWithText.
        // let container = this;
        // // Note: This is an intentional optimization.
        // // See crbug.com/352836 also.
        // // No need to do anything if the text is identical.
        // let childNodes = this.childNodes;
        // if (childNodes.length == 1) {
        //   let t = this.first_child_!.AsText();
        //   if (t) {
        //     if (t.data === text && text.length > 0)
        //       return;
        //   }
        // }
        //
        // // https://www.w3.org/TR/dom/#dom-node-textcontent
        // // 1. Let node be null.
        // let new_node: Optional<Node>;
        //
        // // 2. If new value is not the empty string, set node to a new Text node whose
        // //    data is new value.
        // let new_text_content = this.textContent || '';
        // if (new_text_content.length) {
        //   new_node = this.GetDocument()!.createTextNode(new_text_content);
        // }
        // // 3. Replace all with node within the context object.
        // if (new_node) {
        //   this.ReplaceAll(new_node);
        // }
        //
        // // Note: This API will not insert empty text nodes:
        // // https://dom.spec.whatwg.org/#dom-node-textcontent
        // return;
        let container = this.AsContainerNode();
        DCHECK(container);
        // Note: This is an intentional optimization.
        // See crbug.com/352836 also.
        // No need to do anything if the text is identical.
        let childNodes = this.childNodes;
        if (childNodes.length == 1) {
          let t = this.first_child_!.AsText();
          if (t) {
            if (t.data === text && text.length > 0)
              return;
          }
        }

        if (!text) {
          container.RemoveChildren(SubtreeModificationAction.kDispatchSubtreeModifiedEvent);
        } else {
          container.RemoveChildren(SubtreeModificationAction.kOmitSubtreeModifiedEvent);
          container.appendChild(this.GetDocument()!.createTextNode(text));
        }
      }
      case NodeType.kDocumentNode:
        // Do nothing.
        return;
    }
    NOTREACHED();
  }
  first_element_child(): Optional<Element> {
    let child = this.firstChild;
    while (child) {
      if (child.IsElement()) {
        return child as Element;
      }
      child = child.nextSibling
    }
    return undefined;
  }
  get lastElementChild(): Optional<Element> {
    let child = this.lastChild
    while (child) {
      if (child.IsElement()) {
        return child as Element;
      }
      child = child.previousSibling
    }
    return undefined;
  }
  get nextElementSibling(): Optional<Element> {
    let sibling = this.next_sibling();
    while (sibling) {
      if (sibling.IsElement()) {
        return sibling.AsElement();
      }
      sibling = sibling.next_sibling();
    }
    return undefined;
  }
  contains(other_node: Optional<Node>): boolean {
    let candidate: Optional<Node> = other_node;
    while (candidate) {
      if (this === candidate) {
        return true;
      }
      candidate = candidate.parentNode;
    }
    return false;
  }

  CommonAncestor(other: Node): Optional<Node> {
    if (this == other)
      return this;
    if (this.GetDocument() != other.GetDocument())
      return undefined;
    let this_depth = 0;
    for (let node: Optional<Node> = this; node; node = node.parentNode) {
      if (node == other)
        return node;
      this_depth++;
    }
    let other_depth = 0;
    for (let node: Optional<Node> = other; node; node = node.parentNode) {
      if (node == this)
        return this;
      other_depth++;
    }
    let this_iterator: Optional<Node> = this;
    let other_iterator: Optional<Node> = other;
    if (this_depth > other_depth) {
      for (let i = this_depth; i > other_depth; --i)
        this_iterator = assertIsDefined(this_iterator).parentNode;
    } else if (other_depth > this_depth) {
      for (let i = other_depth; i > this_depth; --i)
        other_iterator = (assertIsDefined(other_iterator)).parentNode;
    }
    while (this_iterator) {
      if (this_iterator == other_iterator)
        return this_iterator;
      this_iterator = assertIsDefined(this_iterator).parentNode;
      other_iterator = (assertIsDefined(other_iterator)).parentNode;
    }
    DCHECK(!other_iterator);
    return undefined;
  }

  HasChildNodes() {
    return !!this.first_child_;
  }

  appendChild(new_child: Node) {
    TRACE_EVENT0('cobalt.dom', 'Node.appendChild()');
    // The appendChild(node) method must return the result of appending node to
    // the context object.
    // To append a node to a parent, pre-insert node into parent before null.
    return this.PreInsert(new_child);
  }
  removeChild(node: Node): Optional<Node> {
    TRACE_EVENT0('cobalt.dom', 'Node.removeChild()');
    // The removeChild(child) method must return the result of pre-removing child
    // from the context object.
    return this.PreRemove(node);
  }
  // Algorithm for InsertBefore:
//   https://www.w3.org/TR/dom/#dom-node-insertbefore
  insertBefore(new_child: Node, reference_child: Optional<Node>): Optional<Node> {
    TRACE_EVENT0('cobalt.dom', 'Node.InsertBefore()');
    // The insertBefore(node, child) method must return the result of
    // pre-inserting node into the context object before child.
    return this.PreInsert(new_child, reference_child);
  }

  // Algorithm for ReplaceAll:
  //   https://www.w3.org/TR/dom/#concept-node-replace-all
  ReplaceAll(node: Node) {
    TRACE_EVENT0('cobalt.dom', 'Node.ReplaceAll()');
    // 1. If node is not null, adopt node into parent's node document.
    if (node) {
      node.AdoptIntoDocument(this.GetDocument());
    }

    // 2. Let removedNodes be parent's children.
    let removed_nodes = new NodeList();
    let next_child = this.first_child_;
    while (next_child) {
      removed_nodes.AppendNode(next_child);
      next_child = next_child.next_sibling();
    }

    // 3. Let addedNodes be the empty list if node is null, node's children if
    //    node is a DocumentFragment node, and a list containing node otherwise.
    let added_nodes = new NodeList();
    if (node) {
      added_nodes.AppendNode(node);
    }

    // 4. Remove all parent's children, in tree order, with the suppress observers
    //    flag set.
    while (this.HasChildNodes()) {
      this.Remove(this.firstChild!, true);
    }

    // 5. If node is not null, insert node into parent before null with the
    //    suppress observers flag set.
    if (node) {
      this.Insert(node, undefined, true);
    }

    // 6. Queue a mutation record of "childList" for parent with addedNodes
    //    addedNodes and removedNodes removedNodes.
    // std.unique_ptr<RegisteredObserverVector> observers =
    //   GatherInclusiveAncestorsObservers();
    // if (!observers.empty()) {
    //   MutationReporter mutation_reporter(this, std.move(observers));
    //   scoped_refptr<dom.NodeList> new_added_nodes = new dom.NodeList();
    //   if (node) {
    //     new_added_nodes.AppendNode(node);
    //   }
    //   if (new_added_nodes.length() > 0 || removed_nodes.length() > 0) {
    //     mutation_reporter.ReportChildListMutation(new_added_nodes, removed_nodes,
    //       NULL /* previous_sibling */,
    //       NULL /* next_sibling */);
    //   }
    // }
  }

  abstract Duplicate(): Node

  // Algorithm for CloneNode:
//   https://www.w3.org/TR/2015/WD-dom-20150618/#dom-node-clonenode
  cloneNode(deep: boolean): Node {
    TRACE_EVENT0('cobalt.dom', 'Node.CloneNode()');
    let new_node = this.Duplicate();
    DCHECK(new_node);
    if (deep) {
      let child = this.first_child_;
      while (child) {
        let new_child = child.cloneNode(true);
        DCHECK(new_child);
        new_node.appendChild(new_child);
        child = child.next_sibling_;
      }
    }
    return new_node;
  }
  //#region Custom
  // Node generation counter that will be modified for every content change
  // that affects the topology of the subtree defined by this node.
  // The returned node generation will be never equal to kInvalidNodeGeneration.
  node_generation(): number {
    return this.node_generation_;
  }
  UpdateGenerationForNodeAndAncestors() {
    if (++this.node_generation_ == NodeGeneration.kInvalidNodeGeneration) {
      this.node_generation_ = NodeGeneration.kInitialNodeGeneration;
    }
    if (this.parent_) {
      this.parent_.UpdateGenerationForNodeAndAncestors();
    }
  }
  GetRootNode(): Optional<Node> {
    let root: Optional<Node> = this;
    while (root && root.parentNode) {
      root = root.parentNode;
    }
    return root;
  }

//#endregion

  //#region private
  // A node's node document can be changed by the adopt algorithm.
  //   https://www.w3.org/TR/dom/#concept-node-adopt
  private AdoptIntoDocument(document: Optional<Document>) {
    TRACE_EVENT0('cobalt.dom', 'Node.AdoptIntoDocument()');
    DCHECK(!this.IsDocument());
    if (!document) {
      return;
    }

    // 1, Not needed by Cobalt.

    // 2. If node's parent is not null, remove node from its parent.
    if (this.parent_) {
      this.parent_.removeChild(this);
    }

    // 3. Set node's inclusive descendants's node document to document.
    this.node_document_ = document;
    let it = new NodeDescendantsIterator(this);
    let descendant = it.First();
    while (descendant) {
      descendant.node_document_ = document;
      descendant = it.Next();
    }

    // 4. Not needed by Cobalt.
  }

  // Algorithm for PreInsert:
  //   https://www.w3.org/TR/dom/#concept-node-pre-insert
  private PreInsert(node: Node, child?: Optional<Node>): Optional<Node> {
    TRACE_EVENT0('cobalt.dom', 'Node.PreInsert()');
    // 1. Ensure pre-insertion validity of node into parent before child.
    if (!this.EnsurePreInsertionValidity(node, child)) {
      return undefined;
    }

    // 2. Let reference child be child.
    // 3. If reference child is node, set it to node's next sibling.
    // 4. Adopt node into parent's node document.
    // 5. Insert node into parent before reference child.
    node.AdoptIntoDocument(this.node_document_!);
    this.Insert(node, child == node ? child.nextSibling : child);

    // 6. Return node.
    return node;
  }

  // Algorithm for EnsurePreInsertionValidity:
  //   https://www.w3.org/TR/dom/#concept-node-ensure-pre-insertion-validity
  private EnsurePreInsertionValidity(node: Node, child: Optional<Node>): boolean {
    if (!node) {
      return false;
    }

    // 1. If parent is not a Document, DocumentFragment, or Element node, throw a
    // "HierarchyRequestError".
    if (!this.IsDocument() && !this.IsElement()) {
      // TODO: Throw JS HierarchyRequestError.
      return false;
    }

    // 2. If node is a host-including inclusive ancestor of parent, throw a
    // "HierarchyRequestError".
    let ancestor: Optional<Node> = this;
    while (ancestor) {
      if (node == ancestor) {
        // TODO: Throw JS HierarchyRequestError.
        return false;
      }
      ancestor = ancestor.parentNode;
    }

    // 3. If child is not null and its parent is not parent, throw a
    // "NotFoundError" exception.
    if (child && child.parentNode != this) {
      // TODO: Throw JS NotFoundError.
      return false;
    }

    // 4. If node is not a DocumentFragment, DocumentType, Element, Text,
    // ProcessingInstruction, or Comment node, throw a "HierarchyRequestError".
    // Note: Since we support CDATASection, it is also included here, so the only
    // type that is excluded is document.
    if (node.IsDocument()) {
      // TODO: Throw JS HierarchyRequestError.
      return false;
    }

    // // 5. If either node is a Text node and parent is a document, or node is a
    // // doctype and parent is not a document, throw a "HierarchyRequestError".
    // if ((node.IsText() && this.IsDocument())) {
    //   // TODO: Throw JS HierarchyRequestError.
    //   return false;
    // }

    // 6. Not needed by Cobalt.

    return true;
  }

  // Algorithm for PreRemove:
  //   https://www.w3.org/TR/dom/#concept-node-pre-remove
  private PreRemove(child: Node): Optional<Node> {
    TRACE_EVENT0('cobalt.dom', 'Node.PreRemove()');
    // 1. If child's parent is not parent, throw a "NotFoundError" exception.
    if (!child || child.parentNode !== this.AsContainerNode()) {
      // TODO: Throw JS NotFoundError.
      return undefined;
    }

    // 2. Remove child from parent.
    this.Remove(child);

    // 3. Return child.
    return child;
  }

// Algorithm for Insert:
//   https://www.w3.org/TR/dom/#concept-node-insert
  private Insert(node: Node, child: Optional<Node>, suppress_observers = true) {
    TRACE_EVENT0('cobalt.dom', 'Node.Insert()');
    // 1. 2. Not needed by Cobalt.
    // 3. Let nodes be node's children if node is a DocumentFragment node, and a
    // list containing solely node otherwise.
    // 4. 5. Not needed by Cobalt.
    // 6. If suppress observers flag is unset, queue a mutation record of
    //    "childList" for parent with addedNodes nodes, nextSibling child, and
    //    previousSibling child's previous sibling or parent's last child if
    //    child is null.
    // 7. For each newNode in nodes, in tree order, run these substeps:
    //   1. Insert newNode into parent before child or at the end of parent if
    //   child is null.
    //   2. Run the insertion steps with newNode.

    node.parent_ = this.AsContainerNode();

    let next_sibling = child;
    let previous_sibling = next_sibling ? next_sibling.previous_sibling_ : this.last_child_;

    if (previous_sibling) {
      previous_sibling.next_sibling_ = node;
    } else {
      this.first_child_ = node;
    }
    node.previous_sibling_ = previous_sibling;

    if (next_sibling) {
      next_sibling.previous_sibling_ = node;
    } else {
      this.last_child_ = node;
    }
    node.next_sibling_ = next_sibling;

    // Custom, not in any spec.
    this.OnMutation();
    node.UpdateGenerationForNodeAndAncestors();

    // Invalidate the layout boxes of the new parent as a result of its children
    // being changed.
    // NOTE: The added node does not have any invalidations done, because they
    // occur on the remove and are guaranteed to not be needed at this point.
    this.InvalidateLayoutBoxesOfNodeAndAncestors();

    if (this.inserted_into_document_) {
      node.OnInsertedIntoDocument();
      this.GetDocument()?.OnDOMMutation();
    }
  }

  OnInsertedIntoDocument() {
    DCHECK(this.node_document_);
    DCHECK(!this.inserted_into_document_);
    this.inserted_into_document_ = true;

    let child = this.first_child_;
    while (child) {
      child.OnInsertedIntoDocument();
      child = child.next_sibling_;
    }
  }

  OnRemovedFromDocument() {
    DCHECK(this.inserted_into_document_);
    this.inserted_into_document_ = false;

    let child = this.first_child_;
    while (child) {
      child.OnRemovedFromDocument();
      child = child.next_sibling_;
    }
  }
  OnMutation() {
  }

  // Algorithm for Remove:
  //   https://www.w3.org/TR/dom/#concept-node-remove
  private Remove(node: Node, suppress_observers = true) {
    DCHECK(node);
    TRACE_EVENT0('cobalt.dom', 'Node.Remove()');

    this.OnMutation();
    node.UpdateGenerationForNodeAndAncestors();

    // Invalidate the layout boxes of the previous parent as a result of its
    // children being changed.
    this.InvalidateLayoutBoxesOfNodeAndAncestors();

    // Purge any cached background images now that this node and its descendants
    // are no longer in the tree, so that the images can be released from the
    // resource cache.
    //  node.PurgeCachedBackgroundImagesOfNodeAndDescendants();

    // Invalidate the styles and layout boxes of the node being removed from
    // the tree. These are no longer valid as a result of the child and its
    // descendants losing their inherited styles.
    node.InvalidateComputedStylesOfNodeAndDescendants();
    node.InvalidateLayoutBoxesOfNodeAndDescendants();

    let was_inserted_to_document = node.inserted_into_document_;
    if (was_inserted_to_document) {
      node.OnRemovedFromDocument();
      node.MarkNotDisplayedOnNodeAndDescendants();
    }

    // 1. 5. Not needed by Cobalt.
    // 6. Let oldPreviousSibling be node's previous sibling
    // 7. If suppress observers flag is unset, queue a mutation record of
    // "childList" for parent with removedNodes a list solely containing node,
    // nextSibling node's next sibling, and previousSibling oldPreviousSibling.
    // 8. For each ancestor ancestor of node, if ancestor has any registered
    // observers whose options's subtree is true, then for each such registered
    // observer registered, append a transient registered observer whose observer
    // and options are identical to those of registered and source which is
    // registered to node's list of registered observers.
    // 9. Remove node from its parent.
    // 10. Run the removing steps with node, parent, and oldPreviousSibling.

    let previous_sibling_ = node.previous_sibling_;
    if (previous_sibling_) {
      previous_sibling_.next_sibling_ = node.next_sibling_;
    } else {
      this.first_child_ = node.next_sibling_;
    }

    let next_sibling_ = node.next_sibling_;
    if (next_sibling_) {
      next_sibling_.previous_sibling_ = node.previous_sibling_;
    } else {
      this.last_child_ = node.previous_sibling_;
    }
    node.parent_ = undefined;
    node.previous_sibling_ = undefined;
    node.next_sibling_ = undefined;

    // Custom, not in any spec.

    // if (was_inserted_to_document) {
    node.GetDocument()?.OnDOMMutation();
    // }
  }
//#endregion

  //#region internal
  InvalidateLayoutBoxesOfNodeAndAncestors() {
    this.InvalidateLayoutBoxesOfAncestors();
  }
  InvalidateLayoutBoxesOfNodeAndDescendants() {
    this.InvalidateLayoutBoxesOfDescendants();
  }
  InvalidateLayoutBoxesOfAncestors() {
    if (this.parent_) {
      this.parent_.InvalidateLayoutBoxesOfNodeAndAncestors();
    }
  }
  InvalidateLayoutBoxesOfDescendants() {
    let child = this.first_child_;
    while (child) {
      child.InvalidateLayoutBoxesOfNodeAndDescendants();
      child = child.next_sibling();
    }
  }
  InvalidateComputedStylesOfNodeAndDescendants() {
    this.InvalidateComputedStylesOfDescendants();
  }
  InvalidateComputedStylesOfDescendants() {
    let child = this.first_child_;
    while (child) {
      child.InvalidateComputedStylesOfNodeAndDescendants();
      child = child.next_sibling();
    }
  }
  MarkNotDisplayedOnDescendants() {
    let child = this.first_child_;
    while (child) {
      child.MarkNotDisplayedOnNodeAndDescendants();
      child = child.next_sibling_;
    }
  }
  MarkNotDisplayedOnNodeAndDescendants() {
    this.MarkNotDisplayedOnDescendants();
  }
  //#endregion

  GetLayoutObject() {
    return this.layout_object_;
  }
  SetLayoutObject(obj: LayoutObject) {
    this.layout_object_ = obj;
  }

  ClearFlag(mask: NodeFlags) {
    this.node_flags_ &= ~mask;
  }
  GetFlag(mask: NodeFlags) {
    return this.node_flags_ & mask;
  }
  SetFlag(mask: NodeFlags) {
    this.node_flags_ |= mask;
  }
  ClearNeedsReattachLayoutTree() {
    this.ClearFlag(NodeFlags.kNeedsReattachLayoutTree);
  }
  ClearChildNeedsReattachLayoutTree() {
    this.ClearFlag(NodeFlags.kChildNeedsReattachLayoutTree);
  }
  ChildNeedsReattachLayoutTree() {
    return this.GetFlag(NodeFlags.kChildNeedsReattachLayoutTree);
  }
  // For Element.
  SetHasDisplayLockContext() {
    this.SetFlag(NodeFlags.kHasDisplayLockContext);
  }
  HasDisplayLockContext() {
    return this.GetFlag(NodeFlags.kHasDisplayLockContext);
  }
  IsInUserAgentShadowRoot(): boolean {
    console.warn('shadowroot');
    return false;
    // return ContainingShadowRoot() && ContainingShadowRoot()->IsUserAgent();
  }

  DispatchSubtreeModifiedEvent() {
    // if (IsInShadowTree())
    //   return;
    //
    //
    // if (!GetDocument().HasListenerType(Document::kDOMSubtreeModifiedListener))
    //   return;
    //
    // DispatchScopedEvent(*MutationEvent::Create(
    //   event_type_names::kDOMSubtreeModified, Event::Bubbles::kYes));
  }
}
