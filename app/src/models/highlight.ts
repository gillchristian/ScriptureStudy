import {CONFIG} from "@/config"

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

export const getHighlights = async (
  version: string,
  book: string,
  chapter: number
): Promise<{highlights: Highlight[]; table: Record<string, Highlight>}> =>
  fetch(`${CONFIG.API_URL}/highlights/${version}/${book}/${chapter}`, {
    headers: {Authorization: `Bearer ${localStorage.getItem("secret")}`}
  })
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
      Authorization: `Bearer ${localStorage.getItem("secret")}`
    },
    body: JSON.stringify({verses, color})
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .catch((err) => {
      console.error(err)
      return null
    })

export const deleteHighlight = async ({id, version, book, chapter}: Highlight): Promise<boolean> =>
  fetch(`${CONFIG.API_URL}/highlights/${version}/${book}/${chapter}/${id}`, {
    method: "DELETE",
    headers: {Authorization: `Bearer ${localStorage.getItem("secret")}`}
  })
    .then((res) => res.ok)
    .catch((err) => {
      console.error(err)
      return false
    })
