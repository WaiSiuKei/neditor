import { IKeyboardEvent, } from '../../../../../base/browser/keyboardEvent';
import { DCHECK } from '../../../../../base/check';
import { KeyCode } from '../../../../../base/common/keyCodes';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../../../base/common/notreached';
import { Nullable, } from '../../../../../base/common/typescript';
import { EditorState } from '../state/state';
import { Selection, TextSelection, } from '../state/selection';
import { IEditorView } from './view';

function moveSelectionBlock(state: EditorState, dir: MoveDir) {
  let { $anchor, $head } = state.selection;
  let $side = dir === MoveDir.right ? $anchor.max($head) : $anchor.min($head);
  let $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir === MoveDir.right ? $side.after() : $side.before()) : null;
  return $start && Selection.findFrom($start, dir === MoveDir.right ? 1 : -1);
}

function moveSelectionToInlineOfBlock(state: EditorState, dir: MoveDir): Nullable<Selection> {
  let { $anchor, $head } = state.selection;
  let $side = dir === MoveDir.right ? $anchor.max($head) : $anchor.min($head);
  let $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir === MoveDir.right ? $side.after() : $side.before()) : null;
  if (!$start) return null;
  return Selection.findFrom($start, dir === MoveDir.right ? 1 : -1, true);
}

function apply(view: IEditorView, sel: Selection) {
  view.dispatch(view.state.tr.setSelection(sel));
  return true;
}

enum MoveDir {
  left = 'left',
  right = 'right',
}

function selectHorizontally(view: IEditorView, dir: MoveDir) {
  const { state } = view;
  let { selection } = state;
  let { $anchor, $head } = selection;
  const moveRight = dir === MoveDir.right;
  let $side = moveRight ? $anchor.max($head) : $anchor.min($head);
  if (selection.isTextSelection()) {
    if (selection.empty) {
      let node = moveRight ? $side.nodeAfter : $side.nodeBefore;
      if (
        !node ||
        (node?.isText && !node.nodeSize)
      ) {
        // 移动cursor到上/下个段落里的内容
        let newSel = moveSelectionToInlineOfBlock(state, dir);
        if (newSel) {
          apply(view, newSel);
        }
        return;
      } else {
        // 移动cursor到$side.sibling
        let pos = state.doc.resolve(moveRight ? $side.pos + 1 : $side.pos - 1);
        let newSel = Selection.findFrom(pos, dir === MoveDir.right ? 1 : -1, true);
        if (newSel) {
          apply(view, newSel);
        } else {
          NOTREACHED();
        }
        return;
      }
    } else {
      // 移动cursor到$side
      return apply(view, new TextSelection($side));
    }
  } else {
    NOTIMPLEMENTED();
  }
}

enum DeleteDir {
  forward = 'forward',
  backward = 'backward'
}

function horizontalDelete(view: IEditorView, dir: DeleteDir) {
  if (!(view.state.selection.isTextSelection())) return true;
  let { $head, $anchor, empty } = view.state.selection;
  let tr = view.state.tr;
  if (empty) {
    DCHECK($head.sameParent($anchor));
    let nextNode;
    if (!$head.textOffset) {
      if ($head.parentOffset === 0) {
        // 代表当前是段落的头
        const size = 1;
        if (dir === DeleteDir.backward) tr.delete($head.pos - size, $head.pos);
        else tr.delete($head.pos, $head.pos + size);
        return view.dispatch(tr);
      } else {
        // 代表当前是段落的尾
        DCHECK($head.parent.inlineContent);
        if ($head.parent.nodeSize === 3) {
          // 段落内容只有一个字符
          if (dir === DeleteDir.backward) tr.delete($head.pos - 2, $head.pos + 1);
          else {
            NOTIMPLEMENTED();
          }
          return view.dispatch(tr);
        } else {
          let size = 1;
          if (dir === DeleteDir.backward) tr.delete($head.pos - size, $head.pos);
          else tr.delete($head.pos, $head.pos + size);
          return view.dispatch(tr);
        }
      }
    } else if ((nextNode = dir === DeleteDir.backward ? $head.nodeBefore : $head.nodeAfter) && nextNode) {
      const size = nextNode.isText ? 1 : nextNode.nodeSize;
      if (dir === DeleteDir.backward) tr.delete($head.pos - size, $head.pos);
      else tr.delete($head.pos, $head.pos + size);
      return view.dispatch(tr);

    } else {
      NOTIMPLEMENTED();
    }
  } else {
    view.dispatch(tr.deleteSelection());
  }
  NOTIMPLEMENTED();
}

export function captureKeyDown(view: IEditorView, s: IKeyboardEvent) {
  if (s.keyCode === KeyCode.Backspace || s.keyCode === KeyCode.Delete) {
    return horizontalDelete(view, DeleteDir.backward);
  }
  if (s.keyCode === KeyCode.Enter || s.keyCode === KeyCode.Escape) {
    return true;
  }
  if (s.keyCode === KeyCode.LeftArrow) {
    return selectHorizontally(view, MoveDir.left);
  }
  if (s.keyCode === KeyCode.RightArrow) {
    return selectHorizontally(view, MoveDir.right);
  }
  // else if (code == 38 || (isMacintosh && code == 80 && mods == 'c')) { // Up arrow, Ctrl-p on Mac
  //   return selectVertically(view, -1, mods) || skipIgnoredNodesLeft(view);
  // } else if (code == 40 || (isMacintosh && code == 78 && mods == 'c')) { // Down arrow, Ctrl-n on Mac
  //   return safariDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodesRight(view);
  // } else if (mods == (isMacintosh ? 'm' : 'c') &&
  //   (code == 66 || code == 73 || code == 89 || code == 90)) { // Mod-[biyz]
  //   return true;
  // }
  return false;
}
