const pi = Math.PI;

// -180 ~ 180
export function radiansToDegrees(radians: number) {
  return radians * (180 / pi);
}

export function radiansToDegreesClockwise(radians: number) {
  let val = radians * (180 / pi);
  return val < 0 ? (val + 360) : val;
}

export function degreesToRadians(degrees: number): number {
  return degrees * pi / 180;
}

export const rotate = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number,
): [number, number] =>
  // 𝑎′𝑥=(𝑎𝑥−𝑐𝑥)cos𝜃−(𝑎𝑦−𝑐𝑦)sin𝜃+𝑐𝑥
  // 𝑎′𝑦=(𝑎𝑥−𝑐𝑥)sin𝜃+(𝑎𝑦−𝑐𝑦)cos𝜃+𝑐𝑦.
  // https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
  [
    (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
    (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2,
  ];

