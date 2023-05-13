import {Eq} from "fp-ts/Eq"
import {Ord} from "fp-ts/Ord"
import {Ordering} from "fp-ts/Ordering"

export type Books = {
  count: {[book: string]: number}
  ordered: string[]
  names: {[book: string]: string}
  shorts: {[book: string]: string}
  by_short: {[book: string]: string}
}

export const toChapters = (version: string, books: Books): NamedReference[] =>
  books.ordered.flatMap((book) =>
    new Array(books.count[book]).fill(true).map((_, i) => ({
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

export type Verse = {
  book: string
  chapter: number
  verse: number
}

export const verseEq: Eq<Verse> = {
  equals: (a: Verse, b: Verse) =>
    a.book === b.book && a.chapter === b.chapter && a.verse === b.verse
}

export const verseOrd: Ord<Verse> = {
  ...verseEq,
  compare: (a: Verse, b: Verse): Ordering =>
    a.book < b.book
      ? -1
      : a.book > b.book
      ? 1
      : a.chapter < b.chapter
      ? -1
      : a.chapter > b.chapter
      ? 1
      : a.verse < b.verse
      ? -1
      : a.verse > b.verse
      ? 1
      : 0
}

export type NamedReference = {tag: "chapter"; name: string} & Reference

export const eqReference: Eq<Reference> = {
  equals: (a: Reference, b: Reference) =>
    a.version === b.version && a.book === b.book && a.chapter === b.chapter
}

export const findPrev = (current: Reference, chapters: Books): Reference | undefined => {
  const i = chapters.ordered.findIndex((b) => b === current.book)

  const prev = chapters.ordered[i - 1]

  if (current.chapter === 1) {
    return prev
      ? {
          version: current.version,
          book: prev,
          chapter: chapters.count[prev]
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
  const i = chapters.ordered.findIndex((b) => b === current.book)

  const book = chapters.ordered[i]
  const next = chapters.ordered[i + 1]

  if (chapters.count[book] === current.chapter) {
    return next ? {version: current.version, book: next, chapter: 1} : undefined
  }

  return {
    version: current.version,
    book: current.book,
    chapter: current.chapter + 1
  }
}
