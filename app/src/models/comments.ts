import {CONFIG} from "@/config"

import {Reference} from "./reference"
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
  fetch(`${CONFIG.API_URL}/comments?version=${version}&book=${book}&chapter=${chapter}`, {
    headers: {Authorization: `Bearer ${token}`}
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then((res: Comment[]) => ({
      comments: res,
      table: res.reduce((acc, cur) => {
        cur.verses.forEach((verse) => {
          acc[`${cur.version}-${cur.book}-${cur.chapter}-${verse}`] = cur
        })

        if (cur.verses.length === 0) {
          acc[`${cur.version}-${cur.book}-${cur.chapter}`] = cur
        }

        return acc
      }, {} as Record<string, Comment>)
    }))
    .catch((err) => {
      console.error(err)
      return {comments: [], table: {}}
    })

export const addComment = async (token: string, comment: AddComment): Promise<Comment | null> =>
  fetch(`${CONFIG.API_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(comment)
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .catch((err) => {
      console.error(err)
      return null
    })
