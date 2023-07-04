/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Event } from '@neditor/core/base/common/event';
import { createDecorator } from '@neditor/core/platform/instantiation/common/instantiation';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { Optional } from '@neditor/core/base/common/typescript';

export const ICanvasService = createDecorator<ICanvasService>('ICanvasService');

export interface ICanvasService {
  readonly _serviceBrand: undefined;

  readonly onCanvasAdded: Event<ICanvas>;
  readonly onCanvasRemoved: Event<ICanvas>;
  readonly onDidActiveCanvasChange: Event<ICanvas>;

  addCanvas(canvas: ICanvas): void;
  removeCanvas(canvas: ICanvas): void;
  listCanvases(): readonly ICanvas[];

  getFocusedCanvas(): Optional<ICanvas>;
  getActiveCanvas(): Optional<ICanvas>;
}
