export type Closure = () => void

export type Callback<T> = () => T
export type Callback1<T, A1> = (a1: A1) => T
export type Callback2<T, A1, A2> = (a1: A1, a2: A2) => T
