import { isString } from './type';

export function toPercentage(val: number): string {
  return `${(val * 100)}%`;
}

export function getFloat(str: string): number {
  return parseFloat(str || '0');
}

export function getInt(str: string): number {
  return parseInt(str || '0', 10);
}

export function isPercentage(str: string): boolean {
  return isString(str) && str.endsWith('%');
}

export function nearly(a: number, b: number, threshold = 0.1): boolean {
  return Math.abs(a - b) < threshold;
}

export function clamp(min: number, val: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function castInt(val: number): number {
  return Math.round(val);
}

export function qFuzzyCompare(p1: number, p2: number) {
  return Math.abs(p1 - p2) < Number.EPSILON;
}
