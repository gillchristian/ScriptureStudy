export type Eq<A> = {
  equal: (a: A, b: A) => boolean
}

export const eqStrict: Eq<unknown> = {
  equal: (a, b) => a === b
}

export const eqString: Eq<string> = eqStrict
export const eqNumber: Eq<number> = eqStrict
export const eqBool: Eq<boolean> = eqStrict
