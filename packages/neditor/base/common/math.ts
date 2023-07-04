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
