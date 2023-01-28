import {ReactNode} from "react"

import {Controls} from "@/components/Controls"
import {CommandPalette} from "@/components/CommandPalette"
import {Books, NamedReference, toChapters} from "@/models/reference"
import {CONFIG} from "@/config"

type Params = {
  version: string
  book: string
  chapter: string
}

type Props = {
  params: Params
  children: ReactNode
}

export default async function ChapterLayout({children, params}: Props) {
  const {books, chapters} = await getData(params.version)

  const chapter_ = parseInt(params.chapter, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_
  const reference = {version: params.version, book: params.book, chapter}

  return (
    <>
      {children}
      <CommandPalette reference={reference} books={books} chapters={chapters} />
      <Controls mode="app" />
    </>
  )
}

const getData = async (version: string): Promise<{books: Books; chapters: NamedReference[]}> => {
  const url = `${CONFIG.API_URL}/chapters.json`

  const books: Books = await fetch(url).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error("No chapters"))
  )

  return {books, chapters: toChapters(version, books)}
}
