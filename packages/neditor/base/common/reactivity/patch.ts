const enum EditingMode {
  none,
  update,
  undoRedo,
}

let editingMode = EditingMode.none;

export function isMutating(): boolean {
  return editingMode !== EditingMode.none;
}

export function begin() {
  editingMode = EditingMode.update;
}

const onEndCallbacks: Array<() => void> = [];
export function end() {
  editingMode = EditingMode.none;
  onEndCallbacks.forEach(fn => fn());
}

export function setOnEnd(fn: () => void) {
  onEndCallbacks.push(fn);
}
