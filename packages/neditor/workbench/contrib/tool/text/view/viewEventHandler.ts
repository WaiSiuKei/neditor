
import { IEditorView } from './view';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';

// export function handleMousedown(view: IEditorView, event: MouseEvent) {
//   view.input.shiftKey = event.shiftKey;
//   let flushed = forceDOMFlush(view);
//   let now = Date.now(), type = 'singleClick';
//   if (now - view.input.lastClick.time < 500 && isNear(event, view.input.lastClick) && !event[selectNodeModifier]) {
//     if (view.input.lastClick.type == 'singleClick') type = 'doubleClick';
//     else if (view.input.lastClick.type == 'doubleClick') type = 'tripleClick';
//   }
//   view.input.lastClick = { time: now, x: event.clientX, y: event.clientY, type };
//
//   let pos = view.posAtCoords(eventCoords(event));
//   if (!pos) return;
//
//   if (type == 'singleClick') {
//     if (view.input.mouseDown) view.input.mouseDown.done();
//     view.input.mouseDown = new MouseDown(view, pos, event, !!flushed);
//   } else if ((type == 'doubleClick' ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event)) {
//     event.preventDefault();
//   } else {
//     setSelectionOrigin(view, 'pointer');
//   }
// }

function handleDoubleClick(view: IEditorView, pos: number, inside: number, event: MouseEvent): boolean {
  return NOTIMPLEMENTED();
}

function handleTripleClick(view: IEditorView, pos: number, inside: number, event: MouseEvent): boolean {
  return NOTIMPLEMENTED();
}

function isNear(event: MouseEvent, click: { x: number, y: number }) {
  let dx = click.x - event.clientX, dy = click.y - event.clientY;
  return dx * dx + dy * dy < 100;
}
function eventCoords(event: MouseEvent) {
  return { left: event.clientX, top: event.clientY };
}
