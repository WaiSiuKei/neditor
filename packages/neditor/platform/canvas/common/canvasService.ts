/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Emitter, Event } from '@neditor/core/base/common/event';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { DLOG } from '../../../base/logging';
import { ICanvasService } from './canvas';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { Optional } from '@neditor/core/base/common/typescript';
import { registerSingleton } from '../../instantiation/common/extensions';

export class CanvasManager extends Disposable implements ICanvasService {
  declare readonly _serviceBrand: undefined;

  private readonly _onCanvasAdded: Emitter<ICanvas> = this._register(new Emitter<ICanvas>());
  public readonly onCanvasAdded: Event<ICanvas> = this._onCanvasAdded.event;

  private readonly _onCanvasRemoved: Emitter<ICanvas> = this._register(new Emitter<ICanvas>());
  public readonly onCanvasRemoved: Event<ICanvas> = this._onCanvasRemoved.event;

  private readonly _onDidActiveCanvasChange: Emitter<ICanvas> = this._register(new Emitter<ICanvas>());
  public readonly onDidActiveCanvasChange: Event<ICanvas> = this._onDidActiveCanvasChange.event;

  private readonly _editors: Map<string, ICanvas> = new Map<string, ICanvas>();
  private _editor: Optional<ICanvas>;

  addCanvas(editor: ICanvas): void {
    this._editors.set(editor.id, editor);
    this._editor = editor;
    this._onCanvasAdded.fire(editor);
    this._onDidActiveCanvasChange.fire(editor);
  }

  removeCanvas(editor: ICanvas): void {
    if (this._editors.delete(editor.id)) {
      this._onCanvasRemoved.fire(editor);
    }
  }

  listCanvases(): ICanvas[] {
    return Array.from(this._editors.values());
  }

  getFocusedCanvas(): Optional<ICanvas> {
    return undefined;
  }

  getActiveCanvas(): Optional<ICanvas> {
    return this._editor;
  }
}

registerSingleton(ICanvasService, CanvasManager);
