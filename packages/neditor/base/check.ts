import { isNumber } from './common/type';

export function DCHECK(condition: unknown, ...msgs: any): asserts condition {
  if (isNumber(condition) ? false : !condition) {
    console.warn('!', ...msgs);
  }
}
export function CHECK(condition: unknown) {}
