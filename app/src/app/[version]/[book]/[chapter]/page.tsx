import {Chapter} from "@/components/Chapter"
import {CONFIG} from "@/config"
import {Books, NamedReference, toChapters} from "@/models/reference"

type Params = {
  version: string
  book: string
  chapter: string
}

type Props = {params: Params}

export default async function App({params}: Props) {
  const {books} = await getData(params.version)

  const chapter_ = parseInt(params.chapter, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_
  const reference = {version: params.version, book: params.book, chapter}

  return (
    <>
      {
        // @ts-expect-error
        <Chapter books={books} reference={reference} />
      }
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
