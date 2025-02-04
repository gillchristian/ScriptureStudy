import {Eq} from "fp-ts/Eq"
import {Ord} from "fp-ts/Ord"
import * as Num from "fp-ts/number"
import * as A from "fp-ts/Array"

import {CONFIG} from "@/config"

import {Reference, Books} from "./reference"
import {Output} from "./editor"

export type CommentContents = {
  json: Output
  text: string
  html: string
}

export type Comment = {
  id: string
  version: string
  book: string
  chapter: number
  verses: number[]
  comment: CommentContents
  public: boolean
  highlight: string
  updated_at: string
  created_at: string
}

export type SimpleComment = Omit<Comment, "comment">

const getCommentEq = <C extends SimpleComment>(): Eq<C> => ({
  equals: (a, b) =>
    a.version === b.version &&
    a.book === b.book &&
    a.chapter === b.chapter &&
    A.getEq(Num.Eq).equals(a.verses, b.verses)
})

export const getCommentOrd = <C extends SimpleComment>(books: Books): Ord<C> => {
  const booksOrder = books.ordered.reduce((acc, book, i) => {
    acc[book] = i
    return acc
  }, {} as Record<string, number>)

  return {
    ...getCommentEq<C>(),
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

export const listComments = async (
  token: string,
  books: Books,
  {version, book, chapter}: Partial<Reference> = {}
): Promise<SimpleComment[]> => {
  const qs = new URLSearchParams(
    [
      ["version", version],
      ["book", book],
      ["chapter", chapter?.toString()]
    ].filter((kv): kv is [string, string] => kv[1] !== undefined)
  )

  return fetch(`${CONFIG.API_URL}/comments?${qs}`, {
    headers: {Authorization: `Bearer ${token}`}
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then(A.sort(getCommentOrd(books)))
}

export type AddComment = {
  version: string
  book: string
  chapter: number
  verses: number[]
  comment: CommentContents
  highlight?: string
  public: boolean
}

export const getChapterComments = async (
  token: string,
  {version, book, chapter}: Reference
): Promise<{comments: Comment[]; table: Record<string, Comment>}> =>
  fetch(`${CONFIG.API_URL}/comments/${version}/${book}/${chapter}`, {
    headers: {Authorization: `Bearer ${token}`}
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then((res: Comment[]) => ({
      comments: res,
      table: res.reduce((acc, cur) => {
        acc[`${cur.version}.${cur.book}.${cur.chapter}.${cur.verses.join("-")}`] = cur

        return acc
      }, {} as Record<string, Comment>)
    }))
    .catch((err) => {
      console.error(err)
      return {comments: [], table: {}}
    })

export const addComment = async (
  token: string,
  {version, book, chapter, ...comment}: AddComment
): Promise<Comment | null> =>
  fetch(`${CONFIG.API_URL}/comments/${version}/${book}/${chapter}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(comment)
  })
    .then((res) => (res.status === 204 ? null : res.ok ? res.json() : Promise.reject(res)))
    .catch((err) => {
      console.error(err)
      return null
    })
