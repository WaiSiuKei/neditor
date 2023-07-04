/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Disposable } from '@neditor/core/base/common/lifecycle';
import {
  IDimension,
} from '@neditor/core/base/browser/dom';

import { DeferredPromise, Promises } from '@neditor/core/base/common/async';
import { mark } from '@neditor/core/base/common/performance';
import { IWorkbenchLayoutService } from '../../platform/workbenchLayout/common/workbenchLayout';
import { Part } from "./part";
import { Optional } from "@neditor/core/base/common/typescript";
import { assertIsDefined } from "@neditor/core/base/common/type";
import { ServicesAccessor } from "@neditor/core/platform/instantiation/common/instantiation";
import { ICanvasViewsService } from '../../platform/canvas/browser/canvasViews';

export abstract class Layout extends Disposable implements IWorkbenchLayoutService {
  declare readonly _serviceBrand: undefined;

  readonly container = document.createElement('div');

  editorPart: Optional<ICanvasViewsService>
  private _dimension!: IDimension;
  get dimension(): IDimension {
    return this._dimension;
  }

  private disposed = false;
  parts = new Map<string, Part>();

  constructor(protected readonly parent: HTMLElement) {
    super();
  }

  private readonly whenReadyPromise = new DeferredPromise<void>();
  protected readonly whenReady = this.whenReadyPromise.p;

  private readonly whenRestoredPromise = new DeferredPromise<void>();
  readonly whenRestored = this.whenRestoredPromise.p;
  private restored = false;

  isRestored(): boolean {
    return this.restored;
  }

  initLayout(accessor: ServicesAccessor) {
    // Parts
    this.editorPart = accessor.get(ICanvasViewsService);
  }

  protected restoreParts(): void {
    // distinguish long running restore operations that
    // are required for the layout to be ready from those
    // that are needed to signal restoring is done
    const layoutReadyPromises: Promise<unknown>[] = [];
    const layoutRestoredPromises: Promise<unknown>[] = [];

    // Restore editors
    layoutReadyPromises.push(
      (async () => {
        mark('code/willRestoreEditors');

        // first ensure the editor part is ready
        assertIsDefined(this.editorPart)
        await this.editorPart!.whenReady;
        this.editorPart!.restore();

        // then see for editors to open as instructed
        // it is important that we trigger this from
        // the overall restore flow to reduce possible
        // flicker on startup: we want any editor to
        // open to get a chance to open first before
        // signaling that layout is restored, but we do
        // not need to await the editors from having
        // fully loaded.
        // let editors: IUntypedEditorInput[];
        // if (Array.isArray(this.windowState.initialization.editor.editorsToOpen)) {
        //   editors = this.windowState.initialization.editor.editorsToOpen;
        // } else {
        //   editors = await this.windowState.initialization.editor.editorsToOpen;
        // }
      })(),
    );

    // Await for promises that we recorded to update
    // our ready and restored states properly.
    Promises.settled(layoutReadyPromises).finally(() => {
      this.whenReadyPromise.complete();

      Promises.settled(layoutRestoredPromises).finally(() => {
        this.restored = true;
        this.whenRestoredPromise.complete();
      });
    });
  }

  getPart(id: string) {
    return assertIsDefined(this.parts.get(id))
  }

  registerPart(part: Part) {
    this.parts.set(part.id, part);
  }

  dispose(): void {
    super.dispose();

    this.disposed = true;
  }
}
