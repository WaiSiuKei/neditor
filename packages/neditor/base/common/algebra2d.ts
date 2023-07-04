/**
 * Computes an angle indicating the direction from p1 to p2. If p1 and p2 are too close together to
 * compute an angle, defaultAngle is returned.
 */
import { IPoint, Point, Vector2D } from './geometry';
import { qFuzzyCompare } from './number';

export function directionBetweenPoints(p1: IPoint, p2: IPoint, defaultAngle: number) {
  if (fuzzyPointCompare(p1, p2)) {
    return defaultAngle;
  }

  let diff = Point.SUB(p2, p1);
  return Math.atan2(diff.y, diff.x);
}

function fuzzyPointCompare(p1: IPoint, p2: IPoint) {
  return qFuzzyCompare(p1.x, p2.x) && qFuzzyCompare(p1.y, p2.y);
}

export function norm(a: { x: number, y: number }) {
  return Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2));
}

export class OuterCircle {
  m_c: IPoint;
  m_radius: number;
  m_radius_sq: number;
  m_fadeCoeff: number;
  constructor(
    c: IPoint,
    radius: number
  ) {
    this.m_c = c;
    this.m_radius = radius;
    this.m_radius_sq = Math.pow(radius, 2);
    this.m_fadeCoeff = 1.0 / (Math.pow(radius + 1.0, 2) - this.m_radius_sq);
  }
}

export function abs(pt: IPoint): IPoint {
  return new Point(Math.abs(pt.x), Math.abs(pt.y));
}
