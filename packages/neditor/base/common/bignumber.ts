import Big from 'big.js';

/*
 * Return 1 if the value of this Big is greater than the value of Big y,
 *       -1 if the value of this Big is less than the value of Big y, or
 *        0 if they have the same value.
 */
export function cmp(a: string, b: string): -1 | 0 | 1 {
  return (new Big(a)).cmp(new Big(b))
}

export function plus(a: string, b: string): string {
  return (new Big(a)).plus(new Big(b)).toString()
}

export function devideBy2(val: string): string {
  return (new Big(val)).div(2).toString()
}
