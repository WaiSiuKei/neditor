// Given an x,y position on the editor, get the position in the document.
import { DCHECK } from '../../../../../base/check';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../../../base/common/notreached';
import { Optional } from '../../../../../base/common/typescript';
import { HTMLElement } from '../../../../../engine/dom/html_element';
import { Range } from '../../../../../engine/dom/range';
import { EditorState } from '../state/state';
import { DOMNode, nodeSize, textRange } from './dom';
import { IEditorView } from './view';

export type Rect = {left: number, right: number, top: number, bottom: number}

export function posAtCoords(view: IEditorView, coords: { top: number, left: number }): Optional<{ pos: number, inside: number }> {
  let doc = view.root;
  let node: Optional<DOMNode>;
  let offset = 0;
  NOTIMPLEMENTED();
  // if ((doc as any).caretPositionFromPoint) {
  //   try { // Firefox throws for this call in hard-to-predict circumstances (#994)
  //     let pos = (doc as any).caretPositionFromPoint(coords.left, coords.top);
  //     if (pos) ({ offsetNode: node, offset } = pos);
  //   } catch (_) {}
  // }
  // if (!node && doc.caretRangeFromPoint) {
  //   let range = doc.caretRangeFromPoint(coords.left, coords.top);
  //   if (range) ({ startContainer: node, startOffset: offset } = range);
  // }
  //
  // let elt = ((view.root as any).elementFromPoint ? view.root : doc)
  //   .elementFromPoint(coords.left, coords.top) as HTMLElement;
  // let pos;
  // if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
  //   let box = view.dom.getBoundingClientRect();
  //   if (!inRect(coords, box)) return null;
  //   elt = elementFromPoint(view.dom, coords, box);
  //   if (!elt) return null;
  // }
  //
  // elt = targetKludge(elt, coords);
  // if (node) {
  //   // Suspiciously specific kludge to work around caret*FromPoint
  //   // never returning a position at the end of the document
  //   if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild!.nodeType == 1 &&
  //     coords.top > (node.lastChild as HTMLElement).getBoundingClientRect().bottom)
  //     pos = view.state.doc.content.size;
  //     // Ignore positions directly after a BR, since caret*FromPoint
  //     // 'round up' positions that would be more accurately placed
  //   // before the BR node.
  //   else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != 'BR')
  //     pos = posFromCaret(view, node, offset, coords);
  // }
  // if (pos == null) pos = posFromElement(view, elt, coords);
  //
  // let desc = view.docView.nearestDesc(elt, true);
  // return { pos, inside: desc ? desc.posAtStart - desc.border : -1 };
}

function singleRect(target: HTMLElement | Range, bias: number): DOMRect {
  NOTIMPLEMENTED();
  // let rects = target.getClientRects();
  // return !rects.length ? target.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1];
}

function flattenV(rect: DOMRect, left: boolean) {
  if (rect.width == 0) return rect;
  let x = left ? rect.left : rect.right;
  return { top: rect.top, bottom: rect.bottom, left: x, right: x };
}

const BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;

// Given a position in the document model, get a bounding box of the
// character at that position, relative to the window.
export function coordsAtPos(view: IEditorView, pos: number, side: number): Rect {
  let { node, offset, atom } = view.docView.domFromPos(pos, side < 0 ? -1 : 1);

  let supportEmptyRange = true;
  if (node.nodeType == 3) {
    // These browsers support querying empty text ranges. Prefer that in
    // bidi context or when at the end of a node.
    if (supportEmptyRange && (BIDI.test(node.nodeValue!) || (side < 0 ? !offset : offset == node.nodeValue!.length))) {
      return singleRect(textRange(view, node.AsText()!, offset, offset), side);
    } else {
      let from = offset, to = offset, takeSide = side < 0 ? 1 : -1;
      if (side < 0 && !offset) {
        to++;
        takeSide = -1;
      } else if (side >= 0 && offset == node.nodeValue!.length) {
        from--;
        takeSide = 1;
      } else if (side < 0) { from--; } else { to++; }
      return flattenV(singleRect(textRange(view, node.AsText()!, from, to), 1), takeSide < 0);
    }
  }

  let $dom = view.state.doc.resolve(pos - (atom || 0));
  // Return a horizontal line in block context
  if (!$dom.parent.inlineContent) {
    NOTREACHED();
    // if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
    //   let before = node.childNodes[offset - 1];
    //   DCHECK(before);
    //   if (before.nodeType == 1) return flattenH((before as HTMLElement).getBoundingClientRect(), false);
    // }
    // if (atom == null && offset < nodeSize(node)) {
    //   let after = node.childNodes[offset];
    //   if (after.nodeType == 1) return flattenH((after as HTMLElement).getBoundingClientRect(), true);
    // }
    // return flattenH((node as HTMLElement).getBoundingClientRect(), side >= 0);
  }

  // Inline, not in text node (this is not Bidi-safe)
  if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
    let before = node.childNodes[offset - 1];
    DCHECK(before);
    let target = before.nodeType == 3 ? textRange(view, before.AsText()!, nodeSize(before) - (supportEmptyRange ? 0 : 1))
      // BR nodes tend to only return the rectangle before them.
      // Only use them if they are the last element in their parent
      : before.nodeType == 1 && (before.nodeName != 'BR' || !before.nextSibling) ? before : null;
    if (target) return flattenV(singleRect(target as Range | HTMLElement, 1), false);
  }
  if (atom == null && offset < nodeSize(node)) {
    let after = node.childNodes[offset] as DOMNode;
    while (after.pmViewDesc && after.pmViewDesc.ignoreForCoords) after = after.nextSibling!;
    let target = !after ? null : after.nodeType == 3 ? textRange(view, after.AsText()!, 0, (supportEmptyRange ? 0 : 1))
      : after.nodeType == 1 ? after : null;
    if (target) return flattenV(singleRect(target as Range | HTMLElement, -1), true);
  }
  // All else failed, just try to get a rectangle for the target node
  NOTREACHED();
  // return flattenV(singleRect(node.nodeType == 3 ? textRange(view, node.AsText()!) : node as HTMLElement, -side), side >= 0);
}

function withFlushedState<T>(view: IEditorView, state: EditorState, f: () => T): T {
  let viewState = view.state;
  // let active = view.root.activeElement as HTMLElement
  if (viewState != state) view.updateState(state);
  // if (active != view.dom) view.focus()
  try {
    return f();
  } finally {
    if (viewState != state) view.updateState(viewState);
    // if (active != view.dom && active) active.focus()
  }
}

// Whether vertical position motion in a given direction
// from a position would leave a text block.
function endOfTextblockVertical(view: IEditorView, state: EditorState, dir: 'up' | 'down') {
  let sel = state.selection;
  let $pos = dir == 'up' ? sel.$from : sel.$to;
  return withFlushedState(view, state, () => {
    let { node: dom } = view.docView.domFromPos($pos.pos, dir == 'up' ? -1 : 1);
    for (; ;) {
      let nearest = view.docView.nearestDesc(dom, true);
      if (!nearest) break;
      if (nearest.node.isBlock) {
        dom = nearest.contentDOM || nearest.dom;
        break;
      }
      dom = nearest.dom.parentNode!;
    }
    let coords = coordsAtPos(view, $pos.pos, 1);
    for (let child: Optional<DOMNode> = dom.firstChild; child; child = child!.nextSibling) {
      NOTREACHED();
      // let boxes;
      // if (child.nodeType == 1) boxes = (child as HTMLElement).getClientRects();
      // else if (child.nodeType == 3) boxes = textRange(child as Text, 0, child.nodeValue!.length).getClientRects();
      // else continue;
      // for (let i = 0; i < boxes.length; i++) {
      //   let box = boxes[i];
      //   if (box.bottom > box.top + 1 &&
      //     (dir == 'up' ? coords.top - box.top > (box.bottom - coords.top) * 2
      //       : box.bottom - coords.bottom > (coords.bottom - box.top) * 2))
      //     return false;
      // }
    }
    return true;
  });
}

const maybeRTL = /[\u0590-\u08ac]/;

function endOfTextblockHorizontal(view: IEditorView, state: EditorState, dir: 'left' | 'right' | 'forward' | 'backward') {
  let { $head } = state.selection;
  if (!$head.parent.isTextblock) return false;
  let offset = $head.parentOffset, atStart = !offset, atEnd = offset == $head.parent.content.size;
  let sel = view.domSelection();
  // If the textblock is all LTR, or the browser doesn't support
  // Selection.modify (Edge), fall back to a primitive approach
  if (!maybeRTL.test($head.parent.textContent) || !(sel as any).modify)
    return dir == 'left' || dir == 'backward' ? atStart : atEnd;

  return withFlushedState(view, state, () => {
    // This is a huge hack, but appears to be the best we can
    // currently do: use `Selection.modify` to move the selection by
    // one character, and see if that moves the cursor out of the
    // textblock (or doesn't move it at all, when at the start/end of
    // the document).
    let { focusNode: oldNode, focusOffset: oldOff, anchorNode, anchorOffset } = view.domSelection();
    let oldBidiLevel = (sel as any).caretBidiLevel // Only for Firefox
    ;(sel as any).modify('move', dir, 'character');
    let parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
    let { focusNode: newNode, focusOffset: newOff } = view.domSelection();
    DCHECK(parentDOM);
    let result = newNode && !parentDOM.contains(newNode.nodeType == 1 ? newNode : newNode.parentNode) ||
      (oldNode == newNode && oldOff == newOff);
    // Restore the previous selection
    try {
      DCHECK(anchorNode);
      sel.collapse(anchorNode, anchorOffset);
      if (oldNode && (oldNode != anchorNode || oldOff != anchorOffset) && sel.extend) sel.extend(oldNode, oldOff);
    } catch (_) {}
    if (oldBidiLevel != null) (sel as any).caretBidiLevel = oldBidiLevel;
    return result;
  });
}

export type TextblockDir = 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward'

let cachedState: EditorState | null = null;
let cachedDir: TextblockDir | null = null;
let cachedResult: boolean = false;
export function endOfTextblock(view: IEditorView, state: EditorState, dir: TextblockDir) {
  if (cachedState == state && cachedDir == dir) return cachedResult;
  cachedState = state;
  cachedDir = dir;
  return cachedResult = dir == 'up' || dir == 'down'
    ? endOfTextblockVertical(view, state, dir)
    : endOfTextblockHorizontal(view, state, dir);
}
