import { IEditorView } from './view';
import { Selection } from '../state/selection';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';

export function syncNodeSelection(view: IEditorView, sel: Selection) {
  if (sel.isNodeSelection()) {
    NOTIMPLEMENTED();
    // let desc = view.docView.descAt(sel.from)
    // if (desc != view.lastSelectedViewDesc) {
    //   clearNodeSelection(view)
    //   if (desc) (desc as NodeViewDesc).selectNode()
    //   view.lastSelectedViewDesc = desc
    // }
  } else {
    clearNodeSelection(view);
  }
}

// Clear all DOM statefulness of the last node selection.
function clearNodeSelection(view: IEditorView) {
//   if (view.lastSelectedViewDesc) {
//     if (view.lastSelectedViewDesc.parent)
//       (view.lastSelectedViewDesc as NodeViewDesc).deselectNode()
//     view.lastSelectedViewDesc = undefined
//   }
}

export function clearComposition(view: IEditorView) {
  while (view.input.compositionNodes.length > 0) {
    view.input.compositionNodes.pop()!.markParentsDirty();
  }
}
