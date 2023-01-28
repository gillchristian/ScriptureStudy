import {Eq} from "@/lib/Eq"

export type Books = {
  byCount: {[book: string]: number}
  inOrder: string[]
  names: {[book: string]: string}
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
