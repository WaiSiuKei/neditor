export function lodToInvScale(levelOfDetail: number) {
  return 1 << Math.max(0, levelOfDetail);
}
