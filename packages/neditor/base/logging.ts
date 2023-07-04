export const INFO = 0;
export const WARNING = 1;
export const ERROR = 2;
export const FATEL = 3;
export function DLOG(level: number, ...msgs: Array<any>) {
  console.log(...msgs);
}
export function LOG(level: number, ...msgs: Array<any>) {
  console.log(...msgs);
}
export function DLOG_IF(level: number, condition: boolean, ...msgs: Array<any>) {
  if (condition) {
    console.log(msgs);
  }
}
