import {Eq} from "fp-ts/Eq"
import {Ord} from "fp-ts/Ord"
import * as Num from "fp-ts/number"
import * as A from "fp-ts/Array"

import {CONFIG} from "@/config"

import {Books} from "./reference"

export type Highlight = {
  id: string
  version: string
  book: string
  chapter: number
  verses: number[]
  color: string
  updated_at: string
  created_at: string
}

const highlightEq: Eq<Highlight> = {
  equals: (a, b) =>
    a.version === b.version &&
    a.book === b.book &&
    a.chapter === b.chapter &&
    A.getEq(Num.Eq).equals(a.verses, b.verses) &&
    a.color === b.color
}

const getHighlightOrd = (books: Books): Ord<Highlight> => {
  const booksOrder = books.ordered.reduce((acc, book, i) => {
    acc[book] = i
    return acc
  }, {} as Record<string, number>)

  return {
    ...highlightEq,
    compare: (a, b) =>
      a.version < b.version
        ? -1
        : a.version > b.version
        ? 1
        : booksOrder[a.book] < booksOrder[b.book]
        ? -1
        : booksOrder[a.book] > booksOrder[b.book]
        ? 1
        : a.chapter < b.chapter
        ? -1
        : a.chapter > b.chapter
        ? 1
        : A.getOrd(Num.Ord).compare(a.verses, b.verses)
  }
}

export const getAllHighlights = async (books: Books): Promise<Highlight[]> => {
  return fetch(`${CONFIG.API_URL}/highlights`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then(A.sort(getHighlightOrd(books)))
    .catch((err) => {
      console.error(err)
      return []
    })
}

export const getHighlights = async (
  version: string,
  book: string,
  chapter: number
): Promise<{highlights: Highlight[]; table: Record<string, Highlight>}> =>
  fetch(`${CONFIG.API_URL}/highlights/${version}/${book}/${chapter}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then((res: Highlight[]) => ({
      highlights: res,
      table: res.reduce((acc, cur) => {
        cur.verses.forEach((verse) => {
          acc[`${cur.version}-${cur.book}-${cur.chapter}-${verse}-${cur.color}`] = cur
        })

        return acc
      }, {} as Record<string, Highlight>)
    }))
    .catch((err) => {
      console.error(err)
      return {highlights: [], table: {}}
    })

export const createHighlight = async (
  token: string,
  version: string,
  book: string,
  chapter: number,
  verses: number[],
  color: string
): Promise<Highlight | null> =>
  fetch(`${CONFIG.API_URL}/highlights/${version}/${book}/${chapter}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({verses, color})
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .catch((err) => {
      console.error(err)
      return null
    })

export const deleteHighlight = async (
  token: string,
  {id, version, book, chapter}: Highlight
): Promise<boolean> =>
  fetch(`${CONFIG.API_URL}/highlights/${version}/${book}/${chapter}/${id}`, {
    method: "DELETE",
    headers: {Authorization: `Bearer ${token}`}
  })
    .then((res) => res.ok)
    .catch((err) => {
      console.error(err)
      return false
    })
