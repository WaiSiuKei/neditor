import { DCHECK } from '../../../../../base/check';
import { Disposable } from '../../../../../base/common/lifecycle';
import { ICanvasUpdater } from '../canvasUpdater';
import { DOMMatcher, DOMSerializer } from '../model/to_dom';
import { DOMNode } from './dom';
import { HTMLElement } from '../../../../../engine/dom/html_element';
import { Fragment, Node } from '../model';
import { Document } from '../../../../../engine/dom/document';
import { Decoration, DecorationSource, WidgetConstructor, WidgetType, NodeType } from './decoration';
import { Mark } from '../model';
import { domIndex, isEquivalentPosition } from './dom';
import { Optional } from '../../../../../base/common/typescript';
import { assertIsDefined, withNullAsUndefined } from '../../../../../base/common/type';
import { IEditorView } from './view';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../../../base/common/notreached';
import { HTMLBRElement } from '../../../../../engine/dom/html_br_element';
import { AttrNameOfComponentType, ComponentTypes } from '../../../../../canvas/viewModel/path';

/// By default, document nodes are rendered using the result of the
/// [`toDOM`](#model.NodeSpec.toDOM) method of their spec, and managed
/// entirely by the editor. For some use cases, such as embedded
/// node-specific editing interfaces, you want more control over
/// the behavior of a node's in-editor representation, and need to
/// [define](#view.EditorProps.nodeViews) a custom node view.
///
/// Mark views only support `dom` and `contentDOM`, and don't support
/// any of the node view methods.
///
/// Objects returned as node views must conform to this interface.
export interface NodeView {
  /// The outer DOM node that represents the document node.
  dom: DOMNode;

  /// The DOM node that should hold the node's content. Only meaningful
  /// if the node view also defines a `dom` property and if its node
  /// type is not a leaf node type. When this is present, ProseMirror
  /// will take care of rendering the node's children into it. When it
  /// is not present, the node view itself is responsible for rendering
  /// (or deciding not to render) its child nodes.
  contentDOM?: HTMLElement | null;

  /// When given, this will be called when the view is updating itself.
  /// It will be given a node (possibly of a different type), an array
  /// of active decorations around the node (which are automatically
  /// drawn, and the node view may ignore if it isn't interested in
  /// them), and a [decoration source](#view.DecorationSource) that
  /// represents any decorations that apply to the content of the node
  /// (which again may be ignored). It should return true if it was
  /// able to update to that node, and false otherwise. If the node
  /// view has a `contentDOM` property (or no `dom` property), updating
  /// its child nodes will be handled by ProseMirror.
  update?: (node: Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) => boolean;

  /// This will be called to handle setting the selection inside the
  /// node. The `anchor` and `head` positions are relative to the start
  /// of the node. By default, a DOM selection will be created between
  /// the DOM positions corresponding to those positions, but if you
  /// override it you can do something else.
  setSelection?: (anchor: number, head: number, root: Document) => void;

  /// Called when the node view is removed from the editor or the whole
  /// editor is destroyed. (Not available for marks.)
  destroy?: () => void;
}

const NOT_DIRTY = 0, CHILD_DIRTY = 1, CONTENT_DIRTY = 2, NODE_DIRTY = 3;

// Superclass for the various kinds of descriptions. Defines their
// basic structure and shared methods.
export class ViewDesc extends Disposable implements NodeView {
  dirty = NOT_DIRTY;
  node!: Node | null;

  constructor(
    public parent: ViewDesc | undefined,
    public children: ViewDesc[],
    public dom: DOMNode,
    // This is the node that holds the child views. It may be null for
    // descs that don't have children.
    public contentDOM: HTMLElement | null,
    public updater: ICanvasUpdater,
  ) {
    super();
    console.log(dom);
    // An expando property on the DOM node provides a link back to its
    // description.
    dom.pmViewDesc = this;
  }

  dispose() {
    Reflect.deleteProperty(this.dom, 'pmViewDesc');
    for (let child of this.children) {
      child.dispose();
    }
  }

  // Used to check whether a given description corresponds to a
  // widget/mark/node.
  matchesMark(mark: Mark) {
    return false;
  }
  matchesNode(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource) {
    return false;
  }
  matchesHack(nodeName: string) {
    return false;
  }

  // The size of the content represented by this desc.
  get size() {
    let size = 0;
    for (let i = 0; i < this.children.length; i++) size += this.children[i].size;
    return size;
  }

  // For block nodes, this represents the space taken up by their
  // start/end tokens.
  get border() {
    return 0;
  }

  destroy() {
    this.parent = undefined;
    if (this.dom.pmViewDesc == this) this.dom.pmViewDesc = undefined;
    for (let i = 0; i < this.children.length; i++)
      this.children[i].destroy();
  }

  posBeforeChild(child: ViewDesc): number {
    for (let i = 0, pos = this.posAtStart; ; i++) {
      let cur = this.children[i];
      if (cur == child) return pos;
      pos += cur.size;
    }
  }

  get posBefore() {
    return this.parent!.posBeforeChild(this);
  }

  get posAtStart() {
    return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
  }

  get posAfter() {
    return this.posBefore + this.size;
  }

  get posAtEnd() {
    return this.posAtStart + this.size - 2 * this.border;
  }

  localPosFromDOM(dom: DOMNode, offset: number, bias: number): number {
    // If the DOM position is in the content, use the child desc after
    // it to figure out a position.
    if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
      if (bias < 0) {
        let domBefore: Optional<DOMNode>;
        let desc: ViewDesc | undefined;
        if (dom == this.contentDOM) {
          domBefore = withNullAsUndefined(dom.childNodes[offset - 1]);
        } else {
          while (dom.parentNode != this.contentDOM) dom = dom.parentNode!;
          domBefore = dom.previousSibling;
        }
        while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this)) domBefore = domBefore.previousSibling;
        return domBefore ? this.posBeforeChild(desc!) + desc!.size : this.posAtStart;
      } else {
        let domAfter: Optional<DOMNode>;
        let desc: ViewDesc | undefined;
        if (dom == this.contentDOM) {
          domAfter = withNullAsUndefined(dom.childNodes[offset]);
        } else {
          while (dom.parentNode != this.contentDOM) dom = dom.parentNode!;
          domAfter = dom.nextSibling;
        }
        while (domAfter && !((desc = domAfter.pmViewDesc) && desc.parent == this)) domAfter = domAfter.nextSibling;
        return domAfter ? this.posBeforeChild(desc!) : this.posAtEnd;
      }
    }
    // Otherwise, use various heuristics, falling back on the bias
    // parameter, to determine whether to return the position at the
    // start or at the end of this view desc.
    let atEnd;
    if (dom == this.dom && this.contentDOM) {
      atEnd = offset > domIndex(this.contentDOM);
    } else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
      atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
    } else if (this.dom.firstChild) {
      if (offset == 0) for (let search = dom; ; search = search.parentNode!) {
        if (search == this.dom) {
          atEnd = false;
          break;
        }
        if (search.previousSibling) break;
      }
      if (atEnd == null && offset == dom.childNodes.length) for (let search = dom; ; search = search.parentNode!) {
        if (search == this.dom) {
          atEnd = true;
          break;
        }
        if (search.nextSibling) break;
      }
    }
    return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
  }

  // Scan up the dom finding the first desc that is a descendant of
  // this one.
  nearestDesc(dom: DOMNode): ViewDesc | undefined
  nearestDesc(dom: DOMNode, onlyNodes: true): NodeViewDesc | undefined
  nearestDesc(dom: DOMNode, onlyNodes: boolean = false) {
    for (let first = true, cur: Optional<DOMNode> = dom; cur; cur = cur.parentNode) {
      let desc = this.getDesc(cur), nodeDOM;
      if (desc && (!onlyNodes || desc.node)) {
        // If dom is outside of this desc's nodeDOM, don't count it.
        if (first && (nodeDOM = (desc as NodeViewDesc).nodeDOM) &&
          !(nodeDOM.nodeType == 1 ? nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode) : nodeDOM == dom))
          first = false;
        else
          return desc;
      }
    }
  }

  getDesc(dom: DOMNode) {
    let desc = dom.pmViewDesc;
    for (let cur: ViewDesc | undefined = desc; cur; cur = cur.parent) if (cur == this) return desc;
  }

  posFromDOM(dom: DOMNode, offset: number, bias: number) {
    for (let scan: Optional<DOMNode> = dom; scan; scan = scan.parentNode) {
      let desc = this.getDesc(scan);
      if (desc) return desc.localPosFromDOM(dom, offset, bias);
    }
    return -1;
  }

  // Find the desc for the node after the given pos, if any. (When a
  // parent node overrode rendering, there might not be one.)
  descAt(pos: number): ViewDesc | undefined {
    for (let i = 0, offset = 0; i < this.children.length; i++) {
      let child = this.children[i], end = offset + child.size;
      if (offset == pos && end != offset) {
        while (!child.border && child.children.length) child = child.children[0];
        return child;
      }
      if (pos < end) return child.descAt(pos - offset - child.border);
      offset = end;
    }
  }

  domFromPos(pos: number, side: number): { node: DOMNode, offset: number, atom?: number } {
    if (!this.contentDOM) return { node: this.dom, offset: 0, atom: pos + 1 };
    // First find the position in the child array
    let i = 0, offset = 0;
    for (let curPos = 0; i < this.children.length; i++) {
      let child = this.children[i], end = curPos + child.size;
      if (end > pos || child instanceof TrailingHackViewDesc) {
        offset = pos - curPos;
        break;
      }
      curPos = end;
    }
    // If this points into the middle of a child, call through
    if (offset) return this.children[i].domFromPos(offset - this.children[i].border, side);
    // Go back if there were any zero-length widgets with side >= 0 before this point
    // for (let prev; i && !(prev = this.children[i - 1]).size && prev instanceof WidgetViewDesc && prev.side >= 0; i--) {
    // }
    // Scan towards the first useable node
    if (side <= 0) {
      let prev, enter = true;
      for (; ; i--, enter = false) {
        prev = i ? this.children[i - 1] : null;
        if (!prev || prev.dom.parentNode == this.contentDOM) break;
      }
      if (prev && side && enter && !prev.border && !prev.domAtom) return prev.domFromPos(prev.size, side);
      return { node: this.contentDOM, offset: prev ? domIndex(prev.dom) + 1 : 0 };
    } else {
      let next, enter = true;
      for (; ; i++, enter = false) {
        next = i < this.children.length ? this.children[i] : null;
        if (!next || next.dom.parentNode == this.contentDOM) break;
      }
      if (next && enter && !next.border && !next.domAtom) return next.domFromPos(0, side);
      return { node: this.contentDOM, offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length };
    }
  }

  // Used to find a DOM range in a single parent for a given changed
  // range.
  parseRange(
    from: number, to: number, base = 0
  ): { node: DOMNode, from: number, to: number, fromOffset: number, toOffset: number } {
    if (this.children.length == 0)
      return { node: this.contentDOM!, from, to, fromOffset: 0, toOffset: this.contentDOM!.childNodes.length };

    let fromOffset = -1, toOffset = -1;
    for (let offset = base, i = 0; ; i++) {
      let child = this.children[i], end = offset + child.size;
      if (fromOffset == -1 && from <= end) {
        let childBase = offset + child.border;
        // FIXME maybe descend mark views to parse a narrower range?
        if (from >= childBase && to <= end - child.border && child.node &&
          child.contentDOM && this.contentDOM!.contains(child.contentDOM))
          return child.parseRange(from, to, childBase);

        from = offset;
        for (let j = i; j > 0; j--) {
          let prev = this.children[j - 1];
          if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
            fromOffset = domIndex(prev.dom) + 1;
            break;
          }
          from -= prev.size;
        }
        if (fromOffset == -1) fromOffset = 0;
      }
      if (fromOffset > -1 && (end > to || i == this.children.length - 1)) {
        to = end;
        for (let j = i + 1; j < this.children.length; j++) {
          let next = this.children[j];
          if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
            toOffset = domIndex(next.dom);
            break;
          }
          to += next.size;
        }
        if (toOffset == -1) toOffset = this.contentDOM!.childNodes.length;
        break;
      }
      offset = end;
    }
    return { node: this.contentDOM!, from, to, fromOffset, toOffset };
  }

  emptyChildAt(side: number): boolean {
    if (this.border || !this.contentDOM || !this.children.length) return false;
    let child = this.children[side < 0 ? 0 : this.children.length - 1];
    return child.size == 0 || child.emptyChildAt(side);
  }

  domAfterPos(pos: number): Optional<DOMNode> {
    let { node, offset } = this.domFromPos(pos, 0);
    if (node.nodeType != 1 || offset == node.childNodes.length)
      throw new RangeError('No node after pos ' + pos);
    return withNullAsUndefined(node.childNodes[offset]);
  }

  // View descs are responsible for setting any selection that falls
  // entirely inside of them, so that custom implementations can do
  // custom things with the selection. Note that this falls apart when
  // a selection starts in such a node and ends in another, in which
  // case we just use whatever domFromPos produces as a best effort.
  setSelection(anchor: number, head: number, root: Document, force = false): void {
    // If the selection falls entirely in a child, give it to that child
    let from = Math.min(anchor, head), to = Math.max(anchor, head);
    for (let i = 0, offset = 0; i < this.children.length; i++) {
      let child = this.children[i], end = offset + child.size;
      if (from > offset && to < end)
        return child.setSelection(anchor - offset - child.border, head - offset - child.border, root, force);
      offset = end;
    }

    let anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
    let headDOM = head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
    let domSel = root.getSelection()!;

    let brKludge = false;
    if (!(force || brKludge && false) &&
      isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode!, domSel.anchorOffset) &&
      isEquivalentPosition(headDOM.node, headDOM.offset, domSel.focusNode!, domSel.focusOffset))
      return;

    // Selection.extend can be used to create an 'inverted' selection
    // (one where the focus is before the anchor), but not all
    // browsers support it yet.
    let domSelExtended = false;
    // if ((domSel.extend || anchor == head) && !brKludge) {
    //   domSel.collapse(anchorDOM.node, anchorDOM.offset);
    //   try {
    //     if (anchor != head)
    //       domSel.extend(headDOM.node, headDOM.offset);
    //     domSelExtended = true;
    //   } catch (_) {
    //     // In some cases with Chrome the selection is empty after calling
    //     // collapse, even when it should be valid. This appears to be a bug, but
    //     // it is difficult to isolate. If this happens fallback to the old path
    //     // without using extend.
    //     // Similarly, this could crash on Safari if the editor is hidden, and
    //     // there was no selection.
    //   }
    // }
    if (!domSelExtended) {
      if (anchor > head) {
        let tmp = anchorDOM;
        anchorDOM = headDOM;
        headDOM = tmp;
      }
      let range = root.createRange();
      range.setEnd(headDOM.node, headDOM.offset);
      range.setStart(anchorDOM.node, anchorDOM.offset);
      // domSel.removeAllRanges();
      domSel.addRange(range);
    }
  }

  // ignoreMutation(mutation: MutationRecord): boolean {
  //   return !this.contentDOM && (mutation.type as any) != 'selection';
  // }

  get contentLost() {
    return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
  }

  // Remove a subtree of the element tree that has been touched
  // by a DOM change, so that the next update will redraw it.
  markDirty(from: number, to: number) {
    for (let offset = 0, i = 0; i < this.children.length; i++) {
      let child = this.children[i], end = offset + child.size;
      if (offset == end ? from <= end && to >= offset : from < end && to > offset) {
        let startInside = offset + child.border, endInside = end - child.border;
        if (from >= startInside && to <= endInside) {
          this.dirty = from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
          if (from == startInside && to == endInside &&
            (child.contentLost || child.dom.parentNode != this.contentDOM)) child.dirty = NODE_DIRTY;
          else child.markDirty(from - startInside, to - startInside);
          return;
        } else {
          child.dirty = child.dom == child.contentDOM && child.dom.parentNode == this.contentDOM && !child.children.length
            ? CONTENT_DIRTY : NODE_DIRTY;
        }
      }
      offset = end;
    }
    this.dirty = CONTENT_DIRTY;
  }

  markParentsDirty() {
    let level = 1;
    for (let node = this.parent; node; node = node.parent, level++) {
      let dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
      if (node.dirty < dirty) node.dirty = dirty;
    }
  }

  get domAtom() {
    return false;
  }

  get ignoreForCoords() {
    return false;
  }

  isNodeViewDesc(): this is NodeViewDesc {
    return false;
  }
  isTextViewDesc(): this is TextViewDesc {
    return false;
  }
}

// Node view descs are the main, most common type of view desc, and
// correspond to an actual node in the document. Unlike mark descs,
// they populate their child array themselves.
export class NodeViewDesc extends ViewDesc {
  constructor(
    parent: ViewDesc | undefined,
    public node: Node,
    public outerDeco: readonly Decoration[],
    public innerDeco: DecorationSource,
    dom: DOMNode,
    contentDOM: HTMLElement | null,
    readonly nodeDOM: DOMNode,
    readonly view: IEditorView,
    pos: number
  ) {
    super(parent, [], dom, contentDOM, view.updater);
    if (contentDOM) this.updateChildren(view, pos);
  }

  // By default, a node is rendered using the `toDOM` method from the
  // node type spec. But client code can use the `nodeViews` spec to
  // supply a custom node view, which can influence various aspects of
  // the way the node works.
  //
  // (Using subclassing for this was intentionally decided against,
  // since it'd require exposing a whole slew of finicky
  // implementation details to the user code that they probably will
  // never need.)
  static create(parent: ViewDesc,
                node: Node,
                outerDeco: readonly Decoration[],
                innerDeco: DecorationSource,
                view: IEditorView,
                pos: number,
                currentIndex: number
  ) {
    let dom: Optional<DOMNode>;
    let contentDOM: Optional<HTMLElement>;
    let domMaybeReuse: Optional<DOMNode> = withNullAsUndefined(assertIsDefined(parent.contentDOM).childNodes[currentIndex]);
    if (node.isText) {
      if (!dom) {
        if (domMaybeReuse) {
          if (domMaybeReuse.IsText() && domMaybeReuse.textContent === node.text) {
            // equals
            dom = domMaybeReuse;
          } else {
            // remove
            while (domMaybeReuse) {
              domMaybeReuse = rm(domMaybeReuse);
            }
          }
        }
        // fallback
        if (!dom) {
          dom = view.root.createTextNode(node.text!);
          view.updater.updateText(parent.dom, node.text!);
          parent.dom.appendChild(dom);
        }
      }
      if (dom.nodeType != 3) {
        throw new RangeError('Text must be rendered as a DOM text node');
      }
    } else if (!dom) {
      const structure = node.type.spec.toDOM!(node);
      if (!domMaybeReuse
        || (domMaybeReuse && domMaybeReuse?.IsText()) // 这是vue创建的、放在最后的 text
        || (domMaybeReuse && domMaybeReuse.pmViewDesc)
      ) {
        ;({ dom, contentDOM } = DOMSerializer.renderSpec(view.root, structure));
        parent.dom.insertBefore(dom, domMaybeReuse);
        view.updater.insertBefore(parent.dom, node, domMaybeReuse);
      } else {
        ;({ dom, contentDOM } = DOMMatcher.matchSpec(assertIsDefined(domMaybeReuse), structure));
      }
    }

    if (!contentDOM && !node.isText && dom.nodeName != 'BR') { // Chrome gets confused by <br contenteditable=false>
      NOTREACHED();
    }

    let nodeDOM = dom;
    dom = applyOuterDeco(dom, outerDeco, node);

    // if (spec) {
    //   return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, spec, view, pos + 1);
    // }
    if (node.isText) {
      return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view);
    }
    return new NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, view, pos + 1);

  }

  matchesNode(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource) {
    return this.dirty == NOT_DIRTY && node.eq(this.node) &&
      sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco);
  }

  get size() {
    return this.node.nodeSize;
  }

  get border() {
    return this.node.isLeaf ? 0 : 1;
  }

  // Syncs `this.children` to match `this.node.content` and the local
  // decorations, possibly introducing nesting for marks. Then, in a
  // separate step, syncs the DOM inside `this.contentDOM` to
  // `this.children`.
  updateChildren(view: IEditorView, pos: number) {
    let inline = this.node.inlineContent;
    let off = pos;
    let updater = new ViewTreeUpdater(this, null, view);
    iterDeco(
      this.node,
      this.innerDeco,
      (widget, i, insideNode) => {
        NOTREACHED();
        // if (widget.spec.marks)
        //   updater.syncToMarks(widget.spec.marks, inline, view)
        // else if ((widget.type as WidgetType).side >= 0 && !insideNode)
        //   updater.syncToMarks(i == this.node.childCount ? Mark.none : this.node.child(i).marks, inline, view)
        // // If the next node is a desc matching this widget, reuse it,
        // // otherwise insert the widget as a new view desc.
        // updater.placeWidget(widget, view, off)
      },
      (child, outerDeco, innerDeco, i) => {
        // Make sure the wrapping mark descs match the node's marks.
        updater.syncToMarks(child.marks, inline, view);
        // Try several strategies for drawing this node
        let compIndex;
        if (updater.findNodeMatch(child, outerDeco, innerDeco, i)) {
          // Found precise match with existing node view
        } else if (updater.updateNextNode(child, outerDeco, innerDeco, view, i)) {
          // Could update an existing node to reflect this node
        } else {
          // Add it as a new view
          updater.addNode(child, outerDeco, innerDeco, view, off);
        }
        off += child.nodeSize;
      }
    );
    // Drop all remaining descs after the current position.
    updater.syncToMarks([], inline, view);
    if (this.node.isTextblock) updater.addTextblockHacks();
    updater.destroyRest();

    // Sync the DOM if anything changed
    if (updater.changed || this.dirty == CONTENT_DIRTY) {
      renderDescs(this.contentDOM!, this.children, view);
    }
  }

  // If this desc must be updated to match the given node decoration,
  // do so and return true.
  update(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, view: IEditorView) {
    if (this.dirty == NODE_DIRTY ||
      !node.sameMarkup(this.node)) return false;
    this.updateInner(node, outerDeco, innerDeco, view);
    return true;
  }

  updateInner(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, view: IEditorView) {
    this.updateOuterDeco(outerDeco);
    this.node = node;
    this.innerDeco = innerDeco;
    if (this.contentDOM) this.updateChildren(view, this.posAtStart);
    this.dirty = NOT_DIRTY;
  }

  updateOuterDeco(outerDeco: readonly Decoration[]) {
    if (sameOuterDeco(outerDeco, this.outerDeco)) return;
    let needsWrap = this.nodeDOM.nodeType != 1;
    let oldDOM = this.dom;
    this.dom = patchOuterDeco(this.dom, this.nodeDOM,
      computeOuterDeco(this.outerDeco, this.node, needsWrap),
      computeOuterDeco(outerDeco, this.node, needsWrap));
    if (this.dom != oldDOM) {
      oldDOM.pmViewDesc = undefined;
      this.dom.pmViewDesc = this;
    }
    this.outerDeco = outerDeco;
  }

  get domAtom() {
    return this.node.isAtom;
  }

  isNodeViewDesc() {
    return true;
  }
}

// A dummy desc used to tag trailing BR or IMG nodes created to work
// around contentEditable terribleness.
class TrailingHackViewDesc extends ViewDesc {
  matchesHack(nodeName: string) {
    return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName;
  }
  get domAtom() {
    return true;
  }
  get ignoreForCoords() {
    return this.dom.nodeName == 'IMG';
  }
}

// A mark desc represents a mark. May have multiple children,
// depending on how the mark is split. Note that marks are drawn using
// a fixed nesting order, for simplicity and predictability, so in
// some cases they will be split more often than would appear
// necessary.
class MarkViewDesc extends ViewDesc {
  constructor(parent: ViewDesc, readonly mark: Mark, dom: DOMNode, contentDOM: HTMLElement | null, view: IEditorView) {
    super(parent, [], dom, contentDOM, view.updater);
  }

  static create(parent: ViewDesc, mark: Mark, inline: boolean, view: IEditorView): MarkViewDesc {
    return NOTIMPLEMENTED();
    // let custom = view.nodeViews[mark.type.name]
    // let spec: { dom: HTMLElement, contentDOM?: HTMLElement } = custom && (custom as any)(mark, view, inline)
    // if (!spec || !spec.dom)
    //   spec = DOMSerializer.renderSpec(Document.GetInstance(), mark.type.spec.toDOM!(mark, inline)) as any
    // return new MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom as HTMLElement)
  }

  matchesMark(mark: Mark) {
    return this.dirty != NODE_DIRTY && this.mark.eq(mark);
  }

  markDirty(from: number, to: number) {
    super.markDirty(from, to);
    // Move dirty info to nearest node view
    if (this.dirty != NOT_DIRTY) {
      let parent = this.parent!;
      while (!parent.node) parent = parent.parent!;
      if (parent.dirty < this.dirty) parent.dirty = this.dirty;
      this.dirty = NOT_DIRTY;
    }
  }

  slice(from: number, to: number, view: IEditorView) {
    let copy = MarkViewDesc.create(this.parent!, this.mark, true, view);
    let nodes = this.children, size = this.size;
    if (to < size) nodes = replaceNodes(nodes, to, size, view);
    if (from > 0) nodes = replaceNodes(nodes, 0, from, view);
    for (let i = 0; i < nodes.length; i++) nodes[i].parent = copy;
    copy.children = nodes;
    return copy;
  }
}

type OuterDecoLevel = { [attr: string]: string }

const OuterDecoLevel: { new(nodeName?: string): OuterDecoLevel } = function (this: any, nodeName?: string) {
  if (nodeName) this.nodeName = nodeName;
} as any;
OuterDecoLevel.prototype = Object.create(null);

const noDeco = [new OuterDecoLevel];

// Create a view desc for the top-level document node, to be exported
// and used by the view class.
export function docViewDesc(doc: Node,
                            outerDeco: readonly Decoration[],
                            innerDeco: DecorationSource,
                            dom: HTMLElement,
                            view: IEditorView,
): NodeViewDesc {
  applyOuterDeco(dom, outerDeco, doc);
  return new NodeViewDesc(undefined, doc, outerDeco, innerDeco, dom, dom, dom, view, 0);
}

function applyOuterDeco(dom: DOMNode, deco: readonly Decoration[], node: Node) {
  return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1));
}

/*
outerDeco是Array<OuterDecoLevel>
每个deco是html元素的attrs
其中，第一个deco可能包含html元素的tag
 */
function computeOuterDeco(outerDeco: readonly Decoration[], node: Node, needsWrap: boolean) {
  if (outerDeco.length == 0) return noDeco;

  let top = needsWrap ? noDeco[0] : new OuterDecoLevel, result = [top];

  for (let i = 0; i < outerDeco.length; i++) {
    let attrs = (outerDeco[i].type as NodeType).attrs;
    if (!attrs) continue;
    if (attrs.nodeName) {
      NOTREACHED();
      // result.push(top = new OuterDecoLevel(attrs.nodeName));
    }

    for (let name in attrs) {
      let val = attrs[name];
      if (val == null) continue;
      if (needsWrap && result.length == 1) {
        NOTREACHED();
        // result.push(top = new OuterDecoLevel(node.isInline ? 'span' : 'div'));
      }
      if (name == 'class') {
        NOTREACHED();
        // top.class = (top.class ? top.class + ' ' : '') + val;
      } else if (name == 'style') {
        NOTREACHED();
        // top.style = (top.style ? top.style + ';' : '') + val;
      } else if (name != 'nodeName') {
        top[name] = val;
      }
    }
  }

  return result;
}

function patchOuterDeco(outerDOM: DOMNode,
                        nodeDOM: DOMNode,
                        prevComputed: readonly OuterDecoLevel[],
                        curComputed: readonly OuterDecoLevel[]
) {
  // Shortcut for trivial case
  if (prevComputed == noDeco && curComputed == noDeco) return nodeDOM;

  let curDOM = nodeDOM;
  for (let i = 0; i < curComputed.length; i++) {
    let deco = curComputed[i], prev = prevComputed[i];
    if (i) {
      let parent: Optional<DOMNode>;
      if (
        prev
        && prev.nodeName === deco.nodeName
        && curDOM != outerDOM
        && (parent = curDOM.parentNode)
        && parent.nodeName!.toLowerCase() == deco.nodeName
      ) {
        curDOM = parent;
      } else {
        NOTREACHED();
        // parent = Document.GetInstance().createElement(deco.nodeName)
        // ;(parent as any).pmIsDeco = true;
        // parent.appendChild(curDOM);
        // prev = noDeco[0];
        // curDOM = parent;
      }
    }
    patchAttributes(curDOM as HTMLElement, prev || noDeco[0], deco);
  }
  return curDOM;
}

function patchAttributes(dom: HTMLElement, prev: { [name: string]: string }, cur: { [name: string]: string }) {
  for (let name in prev) {
    if (name != 'class' && name != 'style' && name != 'nodeName' && !(name in cur)) {
      console.log('[pm]removeAttribute', name, dom);
      // dom.removeAttribute(name);
    }
  }

  for (let name in cur) {
    if (name != 'class' && name != 'style' && name != 'nodeName' && cur[name] != prev[name]) {
      console.log('[pm]setAttribute', name, cur[name], dom.tagName);
      // dom.setAttribute(name, cur[name]);
    }
  }
  if (prev.class != cur.class) {
    NOTIMPLEMENTED();
    // let prevList = prev.class ? prev.class.split(" ").filter(Boolean) : []
    // let curList = cur.class ? cur.class.split(" ").filter(Boolean) : []
    // for (let i = 0; i < prevList.length; i++) if (curList.indexOf(prevList[i]) == -1)
    //   dom.classList.remove(prevList[i])
    // for (let i = 0; i < curList.length; i++) if (prevList.indexOf(curList[i]) == -1)
    //   dom.classList.add(curList[i])
    // if (dom.classList.length == 0)
    //   dom.removeAttribute("class")
  }
  if (prev.style != cur.style) {
    NOTIMPLEMENTED();
    // if (prev.style) {
    //   let prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, m;
    //   while (m = prop.exec(prev.style)) {
    //     dom.style.removeProperty(m[1]);
    //   }
    // }
    // if (cur.style) {
    //   dom.style.cssText += cur.style
    // }
  }
}

class TextViewDesc extends NodeViewDesc {
  constructor(parent: ViewDesc | undefined, node: Node, outerDeco: readonly Decoration[],
              innerDeco: DecorationSource, dom: DOMNode, nodeDOM: DOMNode, view: IEditorView) {
    super(parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view, 0);
  }

  update(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, view: IEditorView) {
    if (this.dirty == NODE_DIRTY || (this.dirty != NOT_DIRTY && !this.inParent()) ||
      !node.sameMarkup(this.node)) return false;
    this.updateOuterDeco(outerDeco);
    if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue) {
      this.nodeDOM.nodeValue = node.text!;
      this.updater.updateText(this.nodeDOM, node.text);
    }
    this.node = node;
    this.dirty = NOT_DIRTY;
    return true;
  }

  inParent() {
    let parentDOM = this.parent!.contentDOM;
    for (let n: Optional<DOMNode> = this.nodeDOM; n; n = n.parentNode) if (n == parentDOM) return true;
    return false;
  }

  domFromPos(pos: number) {
    return { node: this.nodeDOM, offset: pos };
  }

  localPosFromDOM(dom: DOMNode, offset: number, bias: number) {
    if (dom == this.nodeDOM) return this.posAtStart + Math.min(offset, this.node.text!.length);
    return super.localPosFromDOM(dom, offset, bias);
  }

  ignoreMutation(mutation: MutationRecord) {
    return mutation.type != 'characterData' && (mutation.type as any) != 'selection';
  }

  slice(from: number, to: number, view: IEditorView) {
    let node = this.node.cut(from, to), dom = view.root.createTextNode(node.text!);
    return new TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view);
  }

  markDirty(from: number, to: number) {
    super.markDirty(from, to);
    if (this.dom != this.nodeDOM && (from == 0 || to == this.nodeDOM.nodeValue!.length))
      this.dirty = NODE_DIRTY;
  }

  get domAtom() {
    return false;
  }

  isTextViewDesc(): this is TextViewDesc {
    return true;
  }
}

function sameOuterDeco(a: readonly Decoration[], b: readonly Decoration[]) {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++) if (!a[i].type.eq(b[i].type)) return false;
  return true;
}

// Helper class for incrementally updating a tree of mark descs and
// the widget and node descs inside of them.
class ViewTreeUpdater {
  // Index into `this.top`'s child array, represents the current
  // update position.
  index = 0;
  // When entering a mark, the current top and index are pushed
  // onto this.
  stack: (ViewDesc | number)[] = [];
  // Tracks whether anything was changed
  changed = false;
  preMatch: { index: number, matched: Map<ViewDesc, number>, matches: readonly ViewDesc[] };
  top: ViewDesc;

  constructor(top: NodeViewDesc, readonly lock: DOMNode | null, private readonly view: IEditorView) {
    this.top = top;
    this.preMatch = preMatch(top.node.content, top);
  }

  // Destroy and remove the children between the given indices in
  // `this.top`.
  destroyBetween(start: number, end: number) {
    if (start == end) return;
    for (let i = start; i < end; i++) this.top.children[i].destroy();
    this.top.children.splice(start, end - start);
    this.changed = true;
  }

  // Destroy all remaining children in `this.top`.
  destroyRest() {
    this.destroyBetween(this.index, this.top.children.length);
  }

  // Sync the current stack of mark descs with the given array of
  // marks, reusing existing mark descs when possible.
  syncToMarks(marks: readonly Mark[], inline: boolean, view: IEditorView) {
    let keep = 0, depth = this.stack.length >> 1;
    let maxKeep = Math.min(depth, marks.length);
    while (keep < maxKeep &&
    (keep == depth - 1 ? this.top : this.stack[(keep + 1) << 1] as ViewDesc)
      .matchesMark(marks[keep]) && marks[keep].type.spec.spanning !== false)
      keep++;

    while (keep < depth) {
      this.destroyRest();
      this.top.dirty = NOT_DIRTY;
      this.index = this.stack.pop() as number;
      this.top = this.stack.pop() as ViewDesc;
      depth--;
    }
    while (depth < marks.length) {
      this.stack.push(this.top, this.index + 1);
      let found = -1;
      for (let i = this.index; i < Math.min(this.index + 3, this.top.children.length); i++) {
        let next = this.top.children[i];
        if (next.matchesMark(marks[depth]) && !this.isLocked(next.dom)) {
          found = i;
          break;
        }
      }
      if (found > -1) {
        if (found > this.index) {
          this.changed = true;
          this.destroyBetween(this.index, found);
        }
        this.top = this.top.children[this.index];
      } else {
        let markDesc = MarkViewDesc.create(this.top, marks[depth], inline, view);
        this.top.children.splice(this.index, 0, markDesc);
        this.top = markDesc;
        this.changed = true;
      }
      this.index = 0;
      depth++;
    }
  }

  // Try to find a node desc matching the given data. Skip over it and
  // return true when successful.
  findNodeMatch(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, index: number): boolean {
    let found = -1, targetDesc;
    if (index >= this.preMatch.index &&
      (targetDesc = this.preMatch.matches[index - this.preMatch.index]).parent == this.top &&
      targetDesc.matchesNode(node, outerDeco, innerDeco)) {
      found = this.top.children.indexOf(targetDesc, this.index);
    } else {
      for (let i = this.index, e = Math.min(this.top.children.length, i + 5); i < e; i++) {
        let child = this.top.children[i];
        if (child.matchesNode(node, outerDeco, innerDeco) && !this.preMatch.matched.has(child)) {
          found = i;
          break;
        }
      }
    }
    if (found < 0) return false;
    this.destroyBetween(this.index, found);
    this.index++;
    return true;
  }

  updateNodeAt(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, index: number, view: IEditorView) {
    let child = this.top.children[index] as NodeViewDesc;
    if (child.dirty == NODE_DIRTY && child.dom == child.contentDOM) child.dirty = CONTENT_DIRTY;
    if (!child.update(node, outerDeco, innerDeco, view)) return false;
    this.destroyBetween(this.index, index);
    this.index++;
    return true;
  }

  findIndexWithChild(domNode: DOMNode) {
    for (; ;) {
      let parent = domNode.parentNode;
      if (!parent) return -1;
      if (parent == this.top.contentDOM) {
        let desc = domNode.pmViewDesc;
        if (desc) for (let i = this.index; i < this.top.children.length; i++) {
          if (this.top.children[i] == desc) return i;
        }
        return -1;
      }
      domNode = parent;
    }
  }

  // Try to update the next node, if any, to the given data. Checks
  // pre-matches to avoid overwriting nodes that could still be used.
  updateNextNode(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource,
                 view: IEditorView, index: number): boolean {
    for (let i = this.index; i < this.top.children.length; i++) {
      let next = this.top.children[i];
      if (next.isNodeViewDesc()) {
        let preMatch = this.preMatch.matched.get(next);
        if (preMatch != null && preMatch != index) return false;
        let nextDOM = next.dom;

        // Can't update if nextDOM is or contains this.lock, except if
        // it's a text node whose content already matches the new text
        // and whose decorations match the new ones.
        let locked = this.isLocked(nextDOM) &&
          !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text &&
            next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));
        if (!locked && next.update(node, outerDeco, innerDeco, view)) {
          this.destroyBetween(this.index, i);
          if (next.dom != nextDOM) this.changed = true;
          this.index++;
          return true;
        }
        break;
      }
    }
    return false;
  }

  // Insert the node as a newly created node desc.
  addNode(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, view: IEditorView, pos: number) {
    const idx = this.index;
    this.top.children.splice(this.index++, 0, NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos, idx));
    this.changed = true;
  }

  // Make sure a textblock looks and behaves correctly in
  // contentEditable.
  addTextblockHacks() {
    let lastChild = this.top.children[this.index - 1], parent = this.top;
    while (lastChild instanceof MarkViewDesc) {
      parent = lastChild;
      lastChild = parent.children[parent.children.length - 1];
    }

    if (!lastChild || // Empty textblock
      !(lastChild instanceof TextViewDesc) ||
      /\n$/.test(lastChild.node.text!) /*|| (this.view.requiresGeckoHackNode && /\s$/.test(lastChild.node.text!))*/) {
      // Avoid bugs in Safari's cursor drawing (#1165) and Chrome's mouse selection (#1152)
      // if (lastChild && (lastChild.dom as HTMLElement).contentEditable == "false")
      //   this.addHackNode("IMG", parent)
      this.addHackNode('BR', this.top);
    }
  }

  addHackNode(nodeName: string, parent: ViewDesc) {
    if (parent == this.top && this.index < parent.children.length && parent.children[this.index].matchesHack(nodeName)) {
      this.index++;
    } else {
      let dom = parent.dom.GetDocument()!.createElement(nodeName);
      // if (nodeName == "IMG") {
      //   dom.className = "ProseMirror-separator"
      //   ;(dom as HTMLImageElement).alt = ""
      // }
      if (nodeName == 'BR') {
        dom.setAttribute(AttrNameOfComponentType, ComponentTypes.TrailingBreak);
      } else {
        NOTREACHED();
      }
      let hack = new TrailingHackViewDesc(this.top, [], dom, null, parent.updater);
      if (parent != this.top) parent.children.push(hack);
      else parent.children.splice(this.index++, 0, hack);
      this.changed = true;
    }
  }

  isLocked(node: DOMNode) {
    return this.lock && (node == this.lock || node.nodeType == 1 && node.contains(this.lock.parentNode));
  }
}

// Iterate from the end of the fragment and array of descs to find
// directly matching ones, in order to avoid overeagerly reusing those
// for other nodes. Returns the fragment index of the first node that
// is part of the sequence of matched nodes at the end of the
// fragment.
function preMatch(
  frag: Fragment, parentDesc: ViewDesc
): { index: number, matched: Map<ViewDesc, number>, matches: readonly ViewDesc[] } {
  let curDesc = parentDesc, descI = curDesc.children.length;
  let fI = frag.childCount, matched = new Map, matches = [];
  outer: while (fI > 0) {
    let desc;
    for (; ;) {
      if (descI) {
        let next = curDesc.children[descI - 1];
        if (next instanceof MarkViewDesc) {
          curDesc = next;
          descI = next.children.length;
        } else {
          desc = next;
          descI--;
          break;
        }
      } else if (curDesc == parentDesc) {
        break outer;
      } else {
        // FIXME
        descI = curDesc.parent!.children.indexOf(curDesc);
        curDesc = curDesc.parent!;
      }
    }
    let node = desc.node;
    if (!node) continue;
    if (node != frag.child(fI - 1)) break;
    --fI;
    matched.set(desc, fI);
    matches.push(desc);
  }
  return { index: fI, matched, matches: matches.reverse() };
}

// This function abstracts iterating over the nodes and decorations in
// a fragment. Calls `onNode` for each node, with its local and child
// decorations. Splits text nodes when there is a decoration starting
// or ending inside of them. Calls `onWidget` for each widget.
function iterDeco(
  parent: Node,
  deco: DecorationSource,
  onWidget: (widget: Decoration, index: number, insideNode: boolean) => void,
  onNode: (node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, index: number) => void
) {
  let locals = deco.locals(parent), offset = 0;
  // Simple, cheap variant for when there are no local decorations
  if (locals.length == 0) {
    for (let i = 0; i < parent.childCount; i++) {
      let child = parent.child(i);
      onNode(child, locals, deco.forChild(offset, child), i);
      offset += child.nodeSize;
    }
    return;
  }

  let decoIndex = 0, active = [], restNode = null;
  for (let parentIndex = 0; ;) {
    if (decoIndex < locals.length && locals[decoIndex].to == offset) {
      let widget = locals[decoIndex++];
      let widgets;
      while (decoIndex < locals.length && locals[decoIndex].to == offset) {
        (widgets || (widgets = [widget])).push(locals[decoIndex++]);
      }
      if (widgets) {
        widgets.sort(compareSide);
        for (let i = 0; i < widgets.length; i++) {
          onWidget(widgets[i], parentIndex, !!restNode);
        }
      } else {
        onWidget(widget, parentIndex, !!restNode);
      }
    }

    let child, index;
    if (restNode) {
      index = -1;
      child = restNode;
      restNode = null;
    } else if (parentIndex < parent.childCount) {
      index = parentIndex;
      child = parent.child(parentIndex++);
    } else {
      break;
    }

    for (let i = 0; i < active.length; i++) if (active[i].to <= offset) active.splice(i--, 1);
    while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset)
      active.push(locals[decoIndex++]);

    let end = offset + child.nodeSize;
    if (child.isText) {
      let cutAt = end;
      if (decoIndex < locals.length && locals[decoIndex].from < cutAt) cutAt = locals[decoIndex].from;
      for (let i = 0; i < active.length; i++) if (active[i].to < cutAt) cutAt = active[i].to;
      if (cutAt < end) {
        restNode = child.cut(cutAt - offset);
        child = child.cut(0, cutAt - offset);
        end = cutAt;
        index = -1;
      }
    }

    let outerDeco = child.isInline && !child.isLeaf ? active.filter(d => !d.inline) : active.slice();
    onNode(child, outerDeco, deco.forChild(offset, child), index);
    offset = end;
  }
}

function compareSide(a: Decoration, b: Decoration) {
  return (a.type as WidgetType).side - (b.type as WidgetType).side;
}

// Sync the content of the given DOM node with the nodes associated
// with the given array of view descs, recursing into mark descs
// because this should sync the subtree for a whole node at a time.
function renderDescs(parentDOM: HTMLElement, descs: readonly ViewDesc[], view: IEditorView) {
  let dom = parentDOM.firstChild;
  for (let i = 0; i < descs.length; i++) {
    let desc = descs[i];
    let childDOM = desc.dom;
    if (childDOM.parentNode == parentDOM) {
      const toRemove: DOMNode[] = [];
      while (childDOM != dom) {
        DCHECK(dom);
        let next = dom.nextSibling;
        dom.parentNode!.removeChild(dom);
        dom = next;
      }
      if (toRemove.length) {
        view.updater.removeNodes(toRemove);
      }
      dom = dom.nextSibling;
    } else {
      parentDOM.insertBefore(childDOM, dom);
      if (childDOM.nodeName !== HTMLBRElement.kTagName) {
        view.updater.insertBefore(parentDOM, desc.node!, dom);
      }
    }
    if (desc instanceof MarkViewDesc) {
      let pos = dom ? dom.previousSibling : parentDOM.lastChild;
      renderDescs(desc.contentDOM!, desc.children, view);
      dom = pos ? pos.nextSibling : parentDOM.firstChild;
    }
  }
  const elToRemove: DOMNode[] = [];
  const clearContents: HTMLElement[] = [];
  // vue 的 anchor
  let count = 0;
  while (dom && !Reflect.has(dom, '$anchor')) {
    count++;
    if (count > 100) debugger;
    let next = dom.nextSibling;
    dom.parentNode!.removeChild(dom);
    if (dom.IsElement()) {
      if (dom.getAttribute(AttrNameOfComponentType) !== ComponentTypes.TrailingBreak) {
        elToRemove.push(dom);
      }
    } else {
      clearContents.push(parentDOM);
    }
    dom = next;
  }
  if (elToRemove.length) {
    view.updater.removeNodes(elToRemove);
  }
  if (clearContents) {
    view.updater.removeContent(clearContents);
  }
}

// Remove a DOM node and return its next sibling.
function rm(dom: DOMNode) {
  let next = dom.nextSibling;
  dom.parentNode!.removeChild(dom);
  return next;
}

// Replace range from-to in an array of view descs with replacement
// (may be null to just delete). This goes very much against the grain
// of the rest of this code, which tends to create nodes with the
// right shape in one go, rather than messing with them after
// creation, but is necessary in the composition hack.
function replaceNodes(nodes: readonly ViewDesc[], from: number, to: number, view: IEditorView, replacement?: ViewDesc) {
  let result = [];
  for (let i = 0, off = 0; i < nodes.length; i++) {
    let child = nodes[i], start = off, end = off += child.size;
    if (start >= to || end <= from) {
      result.push(child);
    } else {
      if (start < from) result.push((child as MarkViewDesc | TextViewDesc).slice(0, from - start, view));
      if (replacement) {
        result.push(replacement);
        replacement = undefined;
      }
      if (end > to) result.push((child as MarkViewDesc | TextViewDesc).slice(to - start, child.size, view));
    }
  }
  return result;
}
