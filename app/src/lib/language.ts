export const p = (count: number, word: string, plural?: string) =>
  count === 1 ? word : plural ?? `${word}s`
