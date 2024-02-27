import { initICUModule } from '@neditor/icu';
import { initSkiaModule } from '@neditor/skia';
import { DeferredPromise } from '@neditor/core/base/common/async';
import { IInstantiationService } from '@neditor/core/platform/instantiation/common/instantiation';
import { Optional } from '@neditor/core/base/common/typescript';
import { Canvas } from '@neditor/core/canvas/canvas/canvasImpl';
import { registerSingleton } from '@neditor/core/platform/instantiation/common/extensions';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { ICanvasViewsService } from '../../../../platform/canvas/browser/canvasViews';
import { IModelService } from '../../../../platform/model/common/model';
import { IWorkbenchLayoutService, Parts } from '../../../../platform/workbenchLayout/common/workbenchLayout';
import model from './m';
import { Part } from '../../part';

class EditorPart extends Part implements ICanvasViewsService {
  declare _serviceBrand: undefined;
  container: Optional<HTMLElement>;

  private _isReady = false;
  get isReady(): boolean {
    return this._isReady;
  }

  private readonly whenReadyPromise = new DeferredPromise<void>();
  readonly whenReady = this.whenReadyPromise.p;

  private readonly whenRestoredPromise = new DeferredPromise<void>();
  readonly whenRestored = this.whenRestoredPromise.p;

  private loadingPromise = new DeferredPromise<void>();
  constructor(
    @IInstantiationService private instantiationService: IInstantiationService,
    @IModelService private modelService: IModelService,
  ) {
    super(Parts.EDITOR_PART);
    this.init();
  }

  async init() {
    const initIcu = (async () => {
      const icu = await initICUModule();
      icu.init_icu();
    })();
    const initSkia = (async () => {
      await initSkiaModule();
    })();
    await Promise.all([initSkia, initIcu]);
    this.loadingPromise.complete();
  }

  create(parent: HTMLElement): HTMLElement | undefined {
    this.parent = parent;
    let div = document.createElement('div');
    Object.assign(div.style, {
      outline: 'none',
      position: 'relative'
    } as CSSStyleDeclaration);

    this.container = div;
    parent.appendChild(div);
    // Signal ready
    this.whenReadyPromise.complete();
    this._isReady = true;

    return div;
  }

  async restore() {
    await this.loadingPromise.p;
    if (!this.container) NOTIMPLEMENTED();
    const canvas = this.instantiationService.createInstance(Canvas, this.container);
    const m = this.modelService.createModel(model);
    canvas.setModel(m);
    canvas.focus();
    // Signal restored
    this.whenRestoredPromise.complete();
  }
}

registerSingleton(ICanvasViewsService, EditorPart);
