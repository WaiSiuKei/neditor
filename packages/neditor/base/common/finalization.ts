import { IDisposable } from './lifecycle';

class FinalizationHolder implements IDisposable {
  constructor(public toDispose: IDisposable) {}

  dispose() {
    this.toDispose.dispose();
  }
}

export function registerFinalizable(obj: IDisposable) {
  finalizationRegistry.register(obj, new FinalizationHolder(obj));
}

const finalizationRegistry = new FinalizationRegistry((heldValue: IDisposable) => {
  heldValue.dispose();
});

