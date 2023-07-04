import { ResolvedPos } from '../model';
import { TextSelection } from '../state/selection';
import { IEditorView } from './view';

export function selectionBetween(view: IEditorView, $anchor: ResolvedPos, $head: ResolvedPos, bias?: number) {
  // return view.someProp("createSelectionBetween", f => f(view, $anchor, $head))
  //   || TextSelection.between($anchor, $head, bias)
  return TextSelection.between($anchor, $head, bias);
}
