export function NOTREACHED(...msgs: string[]): never {
  if (msgs.length) {
    console.error(...msgs);
  }
  throw new Error('not reached');
}

export function NOTIMPLEMENTED(...msgs: string[]): never {
  if (msgs.length) {
    console.error(...msgs);
  }
  throw new Error('not implemented');
}
