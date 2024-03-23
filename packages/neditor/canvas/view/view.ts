import { Event } from '../../base/common/event';
import { Matrix3 } from '../../base/common/geometry/matrix3';
import { IDisposable } from '../../base/common/lifecycle';
import { Document } from '../../engine/dom/document';
import { HitTestLevel } from '../../platform/input/common/input';
import { LayoutManager } from '../../engine/layout/layout_manager';
import { ICanvasState } from '../canvas/canvas';

export enum CursorStyle {
  none = 'none',
  arrow = 'default',
  pointer = 'pointer',
  grab = 'grab',
  grabbing = 'grabbing',
  move = 'move',
  text = 'text',
}

export interface ICanvasView extends IDisposable {
  domNode: HTMLElement;
  mx: Matrix3;
  zoom: number;
  document: Document;
  layoutManager: LayoutManager;
  onCameraChagned: Event<void>;

  translate(translateX: number, translateY: number): void;
  setCursor(s: CursorStyle): void;
  currentCursor(): CursorStyle;
  setHitTestLevel(level: HitTestLevel): void;
  internal_disconnect(): void;
  internal_connect(): void;

  reflowOverlay(state: ICanvasState): void;
  reflow(): void;

  focus(): void;
  isFocused(): boolean;
}
