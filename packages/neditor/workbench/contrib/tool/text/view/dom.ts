import { assertIsDefined } from '../../../../../base/common/type';
import type { Node } from '../../../../../engine/dom/node';
import type { Selection as DOMSelection } from '../../../../../engine/editing/selection';
import { selectionBetween } from './selection';
import type { IEditorView } from './view';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';
import { Optional } from '../../../../../base/common/typescript';
import { NodeSelection, Selection } from '../state/selection';
import { NodeViewDesc } from './viewdesc';
import type { ViewDesc } from './viewdesc';
import { syncNodeSelection } from './viewUpdate';
import { Text } from '../../../../../engine/dom/text';

export type DOMNode = Node & { pmViewDesc?: ViewDesc }
export { DOMSelection };
export type DOMSelectionRange = {
  focusNode: DOMNode | null, focusOffset: number,
  anchorNode: DOMNode | null, anchorOffset: number
}

export const selectionCollapsed = function (domSel: DOMSelection) {
  return domSel.isCollapsed;
};

// Scans forward and backward through DOM positions equivalent to the
// given one to see if the two are in the same place (i.e. after a
// text node vs at the end of that text node)
export const isEquivalentPosition = function (node: Node, off: number, targetNode: Node, targetOff: number) {
  if (node === targetNode && off === targetOff) return true;
  return targetNode && (scanFor(node, off, targetNode, targetOff, -1) ||
    scanFor(node, off, targetNode, targetOff, 1));
};

const atomElements = /^(img|br|input|textarea|hr)$/i;

function scanFor(node: Node, off: number, targetNode: Node, targetOff: number, dir: number) {
  for (; ;) {
    if (node == targetNode && off == targetOff) return true;
    if (off == (dir < 0 ? 0 : nodeSize(node))) {
      let parent = node.parentNode;
      if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName))
        return false;
      off = domIndex(node) + (dir < 0 ? 0 : 1);
      node = parent;
    } else if (node.nodeType == 1) {
      node = assertIsDefined(node.childNodes[off + (dir < 0 ? -1 : 0)]);
      off = dir < 0 ? nodeSize(node) : 0;
    } else {
      return false;
    }
  }
}

export function nodeSize(node: Node) {
  return node.nodeType == 3 ? node.nodeValue!.length : node.childNodes.length;
}

function hasBlockDesc(dom: DOMNode) {
  let desc;
  for (let cur: Optional<DOMNode> = dom; cur; cur = cur.parentNode) if (desc = cur.pmViewDesc) break;
  return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
}

export function selectionFromDOM(view: IEditorView, origin: string | null = null): Optional<Selection> {
  let domSel = view.domSelection(), doc = view.state.doc;
  if (!domSel.focusNode) return undefined;
  let nearestDesc = view.docView.nearestDesc(domSel.focusNode);
  let inWidget = nearestDesc && nearestDesc.size == 0;
  let head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
  if (head < 0) return undefined;
  let $head = doc.resolve(head), $anchor, selection;
  if (selectionCollapsed(domSel)) {
    $anchor = $head;
    while (nearestDesc && !nearestDesc.node) nearestDesc = nearestDesc.parent;
    let nearestDescNode = (nearestDesc as NodeViewDesc).node;
    if (nearestDesc && nearestDescNode.isAtom && NodeSelection.isSelectable(nearestDescNode) && nearestDesc.parent
      && !(nearestDescNode.isInline && isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
      let pos = nearestDesc.posBefore;
      selection = new NodeSelection(head == pos ? $head : doc.resolve(pos));
    }
  } else {
    let anchor = view.docView.posFromDOM(domSel.anchorNode!, domSel.anchorOffset, 1);
    if (anchor < 0) return undefined;
    $anchor = doc.resolve(anchor);
  }

  if (!selection) {
    let bias = origin == 'pointer' || (view.state.selection.head < $head.pos && !inWidget) ? 1 : -1;
    selection = selectionBetween(view, $anchor, $head, bias);
  }
  return selection;
}

export function selectionToDOM(view: IEditorView, force = false) {
  let sel = view.state.selection;
  syncNodeSelection(view, sel);

  view.domObserver.disconnectSelection();

  let { anchor, head } = sel;
  view.docView.setSelection(anchor, head, view.root, force);

  view.domObserver.setCurSelection();
  view.domObserver.connectSelection();
}

export function readDOMSelectionChange(view: IEditorView) {
  let origin = view.input.lastSelectionTime > Date.now() - 50 ? view.input.lastSelectionOrigin : null;
  let newSel = selectionFromDOM(view, origin);
  if (newSel && !view.state.selection.eq(newSel)) {
    // if (isChrome && isAndroid &&
    //   view.input.lastKeyCode === 13 && Date.now() - 100 < view.input.lastKeyCodeTime &&
    //   view.someProp("handleKeyDown", f => f(view, keyEvent(13, "Enter"))))
    //   return
    let tr = view.state.tr.setSelection(newSel);
    if (origin == 'pointer') tr.setMeta('pointer', true);
    else if (origin == 'key') {
      NOTIMPLEMENTED();
    }
    view.dispatch(tr);
  }
}

export const domIndex = function (node: Node) {
  for (var index = 0; ; index++) {
    node = node.previousSibling!;
    if (!node) return index;
  }
};

export function isOnEdge(node: Node, offset: number, parent: Node) {
  for (let atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd;) {
    if (node == parent) return true;
    let index = domIndex(node);
    node = node.parentNode!;
    if (!node) return false;
    atStart = atStart && index == 0;
    atEnd = atEnd && index == nodeSize(node);
  }
}

// Note that this will always return the same range, because DOM range
// objects are every expensive, and keep slowing down subsequent DOM
// updates, for some reason.
export const textRange = function (view: IEditorView, node: Text, from?: number, to?: number) {
  let range = view.root.createRange();
  range.setEnd(node, to == null ? node.nodeValue!.length : to);
  range.setStart(node, from || 0);
  return range;
};
