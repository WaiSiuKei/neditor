import { Disposable, toDisposable } from '../../../../base/common/lifecycle';
import OverlayAPP from './overlay.vue';
import { createApp } from 'vue';
import { IOutlineInit } from '../../view';
import { reactive } from '@vue/reactivity';

export class Overlay extends Disposable {
  public outlines: Array<IOutlineInit> = reactive([]);
  private el: HTMLElement;
  constructor(
    private container: HTMLElement,
  ) {
    super();
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'absolute',
      top: '0',
      left: '0',
    } as CSSStyleDeclaration);
    this.container.appendChild(this.el);
    this.mount();
  }

  mount() {
    const overlayApp = createApp(OverlayAPP, { outlines: this.outlines });
    overlayApp.mount(this.el);
    this._register(toDisposable(overlayApp.unmount));
  }
}
