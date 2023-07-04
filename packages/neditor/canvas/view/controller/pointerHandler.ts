import { IDisposable } from '@neditor/core/base/common/lifecycle';
import { IPointerHandlerHelper, MouseHandler } from './mouseHandler';
import { ViewController } from '../viewController';

export class PointerHandler implements IDisposable {
  private handler: MouseHandler | null;

  constructor(private viewController: ViewController, private viewHelper: IPointerHandlerHelper) {
    // if ((platform.isIOS && BrowserFeatures.pointerEvents)) {
    // 	this.handler = this._register(new PointerEventHandler(context, viewController, viewHelper));
    // } else if (window.TouchEvent) {
    // 	this.handler = this._register(new TouchHandler(context, viewController, viewHelper));
    // } else {
    // this.handler = this._register(new MouseHandler(viewController, viewHelper));
    this.handler = new MouseHandler(viewController, viewHelper);
    // }
  }

  dispose() {
    if (this.handler) {
      this.handler.dispose();
    }
  }
}
