import {Eq} from "@/lib/Eq"

export type Books = {
  byCount: {[book: string]: number}
  inOrder: string[]
  names: {[book: string]: string}
  short: {[book: string]: string}
}

export const toChapters = (version: string, books: Books): NamedReference[] =>
  books.inOrder.flatMap((book) =>
    new Array(books.byCount[book]).fill(true).map((_, i) => ({
      tag: "chapter",
      version,
      book,
      chapter: i + 1,
      name: `${books.names[book]} ${i + 1}`
    }))
  )

export type Reference = {
  version: string
  book: string
  chapter: number
}

export type NamedReference = {tag: "chapter"; name: string} & Reference

export const eqReference: Eq<Reference> = {
  equal: (a, b) => a.version === b.version && a.book === b.book && a.chapter === b.chapter
}

export const findPrev = (current: Reference, chapters: Books): Reference | undefined => {
  const i = chapters.inOrder.findIndex((b) => b === current.book)

  const prev = chapters.inOrder[i - 1]

  if (current.chapter === 1) {
    return prev
      ? {
          version: current.version,
          book: prev,
          chapter: chapters.byCount[prev]
        }
      : undefined
  }

  return {
    version: current.version,
    book: current.book,
    chapter: current.chapter - 1
  }
}

export const findNext = (current: Reference, chapters: Books): Reference | undefined => {
  const i = chapters.inOrder.findIndex((b) => b === current.book)

  const book = chapters.inOrder[i]
  const next = chapters.inOrder[i + 1]

  if (chapters.byCount[book] === current.chapter) {
    return next ? {version: current.version, book: next, chapter: 1} : undefined
  }

  return {
    version: current.version,
    book: current.book,
    chapter: current.chapter + 1
  }
}
