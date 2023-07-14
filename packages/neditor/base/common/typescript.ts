export type Values<T> = T[keyof T];
export type EnumToString<T> = T extends `${infer S & string}` ? S : never;
export type EnumValues<T extends string> = Values<{ [K in T]: EnumToString<K> }>;
export type EnumAndLiteral<T extends string> = T | EnumValues<T>;

export type RequiredKeys<T> = {
  [K in keyof T]-?:
  ({} extends { [P in K]: T[K] } ? never : K)
}[keyof T]

export type OptionalKeys<T> = {
  [K in keyof T]-?:
  ({} extends { [P in K]: T[K] } ? K : never)
}[keyof T]

export type ExcludeOptionalProps<T> = Pick<T, RequiredKeys<T>>

export type Optional<T> = T | undefined

export type Nullable<T> = T | null

export type Ptr<T> = T | undefined

export type Constructor = new (...args: any[]) => {};

export interface ConstructorSignature<T> {
  new(...args: any[]): T;
}

export type AccessorCallback<T, R> = (val: T) => R
