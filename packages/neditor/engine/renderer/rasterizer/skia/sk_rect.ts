export type SkRect = number[] | Float32Array
// left, top, right, bottom
export function SkRect_MakeXYWH(x: number, y: number, width: number, height: number): SkRect {
  return [x, y, x + width, y + height];
}
export function SkRect_MakeLeftTopRightBottom(left: number, top: number, right: number, bottom: number): SkRect {
  return [left, top, right, bottom];
}
