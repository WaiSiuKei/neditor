import { StandardMouseEvent } from '@neditor/core/base/browser/mouseEvent';
import { IDisposable } from '@neditor/core/base/common/lifecycle';
import {
  addDisposableListener, addDisposableNonBubblingMouseOutListener,
  addDisposableThrottledListener,
  EventType, getDomNodePagePosition,
  IEventMerger
} from '@neditor/core/base/browser/dom';
import { Matrix3 } from '../../../base/common/geometry/matrix3';
import { IPointerHandlerHelper } from "./mouseHandler";

/**
 * The position of the editor in the page.
 */
export class EditorPagePosition {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number
  ) { }
}

/**
 * Coordinates relative to the whole document (e.g. mouse event's pageX and pageY)
 */
export class PageCoordinates {
  constructor(public readonly x: number, public readonly y: number) {
  }
}

/**
 * Coordinates relative to the the (top;left) of the editor that can be used safely with other internal editor metrics.
 * **NOTE**: This position is obtained by taking page coordinates and transforming them relative to the
 * editor's (top;left) position in a way in which scale transformations are taken into account.
 * **NOTE**: These coordinates could be negative if the mouse position is outside the editor.
 */
export class CoordinatesRelativeToEditor {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) { }
}

export class CanvasMouseEvent extends StandardMouseEvent {
  /**
   * If the event is a result of using `setPointerCapture`, the `event.target`
   * does not necessarily reflect the position in the editor.
   */
  public readonly isFromPointerCapture: boolean;

  /**
   * Coordinates relative to the whole document.
   */
  public readonly pos: PageCoordinates;

  /**
   * Editor's coordinates relative to the whole document.
   */
  public readonly editorPos: EditorPagePosition;

  /**
   * Coordinates relative to the (top;left) of the editor.
   * *NOTE*: These coordinates are preferred because they take into account transformations applied to the editor.
   * *NOTE*: These coordinates could be negative if the mouse position is outside the editor.
   */
  public readonly relativePos: CoordinatesRelativeToEditor;

  constructor(e: MouseEvent, isFromPointerCapture: boolean, editorViewDomNode: HTMLElement, transform: Matrix3) {
    super(e);
    this.isFromPointerCapture = isFromPointerCapture;
    this.pos = new PageCoordinates(this.posx, this.posy);
    this.editorPos = createEditorPagePosition(editorViewDomNode);
    this.relativePos = createCoordinatesRelativeToEditor(transform, this.editorPos, this.pos);
  }
}

export interface EditorMouseEventMerger {
  (lastEvent: CanvasMouseEvent | null, currentEvent: CanvasMouseEvent): CanvasMouseEvent;
}

export class EditorMouseEventFactory {
  constructor(private viewHelper: IPointerHandlerHelper) {
  }

  private _create(e: MouseEvent): CanvasMouseEvent {
    return new CanvasMouseEvent(e, false, this.viewHelper.viewDomNode, this.viewHelper.getTransform());
  }

  public onContextMenu(target: HTMLElement, callback: (e: CanvasMouseEvent) => void): IDisposable {
    return addDisposableListener(target, 'contextmenu', (e: MouseEvent) => {
      callback(this._create(e));
    });
  }

  public onMouseUp(target: HTMLElement, callback: (e: CanvasMouseEvent) => void): IDisposable {
    return addDisposableListener(target, 'mouseup', (e: MouseEvent) => {
      callback(this._create(e));
    });
  }

  public onMouseDown(target: HTMLElement, callback: (e: CanvasMouseEvent) => void): IDisposable {
    return addDisposableListener(target, EventType.MOUSE_DOWN, (e: MouseEvent) => {
      callback(this._create(e));
    });
  }

  public onPointerDown(target: HTMLElement, callback: (e: CanvasMouseEvent, pointerType: string, pointerId: number) => void): IDisposable {
    return addDisposableListener(target, EventType.POINTER_DOWN, (e: PointerEvent) => {
      callback(this._create(e), e.pointerType, e.pointerId);
    });
  }

  public onMouseLeave(target: HTMLElement, callback: (e: CanvasMouseEvent) => void): IDisposable {
    return addDisposableNonBubblingMouseOutListener(target, (e: MouseEvent) => {
      callback(this._create(e));
    });
  }

  public onMouseMove(target: HTMLElement, callback: (e: CanvasMouseEvent) => void): IDisposable {
    return addDisposableListener(target, EventType.MOUSE_MOVE, (e: MouseEvent) => {
      callback(this._create(e));
    });
  }
}

export function createEditorPagePosition(editorViewDomNode: HTMLElement): EditorPagePosition {
  const editorPos = getDomNodePagePosition(editorViewDomNode);
  return new EditorPagePosition(editorPos.left, editorPos.top, editorPos.width, editorPos.height);
}

export function createCoordinatesRelativeToEditor(transform: Matrix3, editorPagePosition: EditorPagePosition, pos: PageCoordinates) {
  // The editor's page position is read from the DOM using getBoundingClientRect().
  //
  // getBoundingClientRect() returns the actual dimensions, while offsetWidth and offsetHeight
  // reflect the unscaled size. We can use this difference to detect a transform:scale()
  // and we will apply the transformation in inverse to get mouse coordinates that make sense inside the editor.
  //
  // This could be expanded to cover rotation as well maybe by walking the DOM up from `editorViewDomNode`
  // and computing the effective transformation matrix using getComputedStyle(element).transform.
  //
  const scaleX = transform.a;
  const scaleY = transform.d;

  // Adjust mouse offsets if editor appears to be scaled via transforms
  const relativeX = (pos.x - editorPagePosition.x) / scaleX - transform.tx;
  const relativeY = (pos.y - editorPagePosition.y) / scaleY - transform.ty;
  return new CoordinatesRelativeToEditor(relativeX, relativeY);
}
