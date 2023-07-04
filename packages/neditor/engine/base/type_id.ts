export type TypeId = number

const idMap = new Map<unknown, TypeId>();
export function baseGetTypeId(type: unknown): TypeId {
  if (idMap.has(type)) {
    return idMap.get(type)!;
  }
  let newId = idMap.size + 1;
  idMap.set(type, newId);
  return newId;
}
