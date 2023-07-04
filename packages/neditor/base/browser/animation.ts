export class AnimationQueue {
  private _pending: number | null = null;
  push(runner: () => void) {
    this.clear();
    this._pending = requestAnimationFrame(() => {
      runner();
      this.clear();
    });
  }
  clear() {
    if (this._pending) {
      cancelAnimationFrame(this._pending);
      this._pending = null;
    }
  }
  dispose() {
    this.clear();
  }
}
