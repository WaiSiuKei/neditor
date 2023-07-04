export class DOMRectReadOnly {
  static fromRect(rectangle: { x: number, y: number, width: number, height: number }) {
    const { x, y, width, height } = rectangle;
    return new DOMRectReadOnly(x, y, width, height);
  }
  protected constructor(
    protected _x: number,
    protected _y: number,
    protected _width: number,
    protected _height: number) {}

  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get top() {
    return this._y;
  }
  get right() {
    return this._x + this._width;
  }
  get bottom() {
    return this._y + this.height;
  }
  get left() {
    return this._x;
  }
}

export class DomRect extends DOMRectReadOnly {

}
