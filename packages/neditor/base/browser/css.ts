export function toFixedPercentage(val: number): string {
  return `${(val * 100).toFixed(2)}%`;
}

export function toFixedPx(val: number): string {
  return `${val.toFixed(2)}px`;
}

export const ZeroPercentage = '0%';
export const ZeroPX = '0px';

export function toPX(val: number): string {
  return `${val}px`;
}
