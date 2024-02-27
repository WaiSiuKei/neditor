const enum EditingMode {
  none,
  update,
  undoRedo,
}

let editingMode = EditingMode.none;

export function begin() {
  editingMode = EditingMode.update;
}

const onEndCallbacks: Array<() => void> = [];
export function end() {
  onEndCallbacks.forEach(fn => fn());
  editingMode = EditingMode.none;
}

export function setOnEnd(fn: () => void) {
  onEndCallbacks.push(fn);
}
