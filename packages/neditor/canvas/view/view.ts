import { IMatrix } from '@neditor/core/base/common/geometry';
import { Event } from '../../base/common/event';
import { IDisposable } from '../../base/common/lifecycle';
import { Optional } from '../../base/common/typescript';
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

export interface IPhysicalCursorPosition {
  blockStart: number;
  inlineStart: number;
  inlineSize: number;
}

export interface ICanvasView extends IDisposable {
  domNode: HTMLElement;
  mx: IMatrix;
  zoom: number;
  document: Document;
  layoutManager: LayoutManager;
  onCursorMoved: Event<Optional<IPhysicalCursorPosition>>;
  onCameraChagned: Event<void>;
  translate(translateX: number, translateY: number): void;
  setCursor(s: CursorStyle): void;
  drawCursor(position: Optional<IPhysicalCursorPosition>): void;
  currentCursor(): CursorStyle;
  setHitTestLevel(level: HitTestLevel): void;
  internal_disconnect(): void;
  internal_connect(): void;

  redraw(state: ICanvasState): void;

  focus(): void;
  isFocused(): boolean;
}

export interface IOutlineInit {
  top: number;
  left: number;
  width: number;
  height: number;
}
