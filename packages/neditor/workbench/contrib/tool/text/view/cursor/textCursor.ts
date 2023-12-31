/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './textCursor.css';
import { toTramsform } from '../../../../../../base/browser/css';
import { createFastDomNode, FastDomNode } from '../../../../../../base/browser/fastDomNode';
import { IntervalTimer } from '../../../../../../base/common/async';
import { Disposable, toDisposable } from '../../../../../../base/common/lifecycle';
import { Optional } from '../../../../../../base/common/typescript';
import { ICanvasView } from '../../../../../../canvas/view/view';

export interface IViewCursorRenderData {
  top: number;
  left: number;
  width: number;
  height: number;
}

export class TextCursor extends Disposable {
  static readonly BLINK_INTERVAL = 500;

  private _domNode: FastDomNode<HTMLElement>;
  private _isVisible: boolean = false;
  private _renderData: Optional<IViewCursorRenderData>;

  private readonly _cursorFlatBlinkInterval: IntervalTimer;

  constructor(
    container: HTMLElement,
    private view: ICanvasView,
  ) {
    super();

    // Create the dom node
    this._domNode = createFastDomNode(document.createElement('div'));
    container.appendChild(this._domNode.domNode);
    this._domNode.setDisplay('none');
    this._domNode.setTop(0);
    this._domNode.setLeft(0);
    this._register(toDisposable(() => this._domNode.domNode.remove()));

    this._cursorFlatBlinkInterval = new IntervalTimer();
    this._register(this._cursorFlatBlinkInterval);

    this._updateDomClassName();
  }

  private _restartBlinking(): void {
    this._cursorFlatBlinkInterval.cancel();

    this.show();

    // flat blinking is handled by JavaScript to save battery life due to Chromium step timing issue https://bugs.chromium.org/p/chromium/issues/detail?id=361587
    this._cursorFlatBlinkInterval.cancelAndSet(() => {
      if (this._isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }, TextCursor.BLINK_INTERVAL);
  }

  private _stopBlinking(): void {
    this._cursorFlatBlinkInterval.cancel();
  }

  private _updateDomClassName(): void {
    this._domNode.setClassName('cursor cursor-line-style cursor-blink');
  }

  public show(): void {
    if (!this._isVisible) {
      this._domNode.setVisibility('visible');
      this._domNode.setTransform(toTramsform(this.view.mx));
      this._isVisible = true;
    }
  }

  public hide(): void {
    if (this._isVisible) {
      this._domNode.setVisibility('hidden');
      this._isVisible = false;
    }
  }

  update(data: Optional<IViewCursorRenderData> = undefined) {
    this._renderData = data;
    this.render();
    if (!this._renderData) {
      this._stopBlinking();
    } else {
      this._restartBlinking();
    }
  }

  public render() {
    if (!this._renderData) {
      this.hide();
      return;
    }
    this._domNode.setDisplay('block');
    this._domNode.setTop(this._renderData.top);
    this._domNode.setLeft(this._renderData.left - 1);
    this._domNode.setWidth(this._renderData.width);
    this._domNode.setHeight(this._renderData.height);
  }
}
