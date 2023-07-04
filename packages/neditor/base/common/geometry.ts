export interface IMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export interface IPoint {
  x: number;
  y: number;
}

export class Point {
  constructor(public x: number, public y: number) {}

  static get initial() {
    return { x: 0, y: 0 };
  }
  static SUB(p1: IPoint, p2: IPoint): IPoint {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
  }
  static ADD(p1: IPoint, p2: IPoint) {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
  }
  static MUL(p: IPoint, val: number): IPoint {
    return { x: p.x * val, y: p.y * val };
  }
  static EQ(a: IPoint, b: IPoint) {
    return a.x === b.x && a.y === b.y;
  }
  MUL_ASSIGN(val: number) {
    this.x *= val;
    this.y *= val;
    return this;
  }
}

export class Vector2D {
  static negate(v: IPoint): IPoint {
    return { x: -v.x, y: -v.y };
  }
}

export class Matrix {
  static parse(str: string): IMatrix {
    let match;
    let f = parseFloat;
    let mPattern = /matrix\s*\((.+)\)/i;
    if ((match = mPattern.exec(str))) {
      let values = match[1].split(',');
      if (values.length != 6) {
        values = match[1].split(' '); //ie
      }
      return {
        a: f(values[0]),
        b: f(values[1]),
        c: f(values[2]),
        d: f(values[3]),
        tx: f(values[4]),
        ty: f(values[5])
      };
    }
    throw new Error('500');
  }

  static get Identity() {
    return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  }

  // static translate(mx: IMatrix, x: number, y: number) {
  //   let tx = mx.tx + x;
  //   let ty = mx.ty + y;
  //   return { ...mx, tx, ty };
  // }

  static translate(mx: IMatrix, vector: IPoint) {
    let tx = mx.tx + vector.x;
    let ty = mx.ty + vector.y;
    return { ...mx, tx, ty };
  }

  static scale(mx: IMatrix, scale: IPoint, center?: IPoint): IMatrix {
    let m = center ? Matrix.translate(mx, center) : { a: mx.a, b: mx.b, c: mx.c, d: mx.d, tx: mx.tx, ty: mx.ty };
    m.a *= scale.x;
    m.b *= scale.x;
    m.c *= scale.y;
    m.d *= scale.y;
    if (center) m = Matrix.translate(m, Vector2D.negate(center));
    return m;
  }
}

export interface ISize {
  width: number
  height: number
}

export class Rect {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0) {
  }
}
