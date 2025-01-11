import {CONFIG} from "@/config"
import {Books, NamedReference, toChapters} from "@/models/reference"

export type Index = {books: Books; chapters: NamedReference[]}

export const getIndex = async (version: string): Promise<Index> => {
  const url = `${CONFIG.BIBLES_URL}/index.json`

  const books: Books = await fetch(url).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error("No chapters"))
  )

  return {books, chapters: toChapters(version, books)}
}
