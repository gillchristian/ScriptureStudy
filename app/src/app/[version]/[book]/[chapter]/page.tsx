import {Chapter} from "@/components/Chapter"
import {Notes} from "@/components/Notes"
import {CONFIG} from "@/config"
import {Books, NamedReference, toChapters} from "@/models/reference"

type Params = {
  version: string
  book: string
  chapter: string
}

type Props = {params: Params}

export default async function ChapterPage({params}: Props) {
  const {books} = await getData(params.version)

  const chapter_ = parseInt(params.chapter, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_
  const reference = {version: params.version, book: params.book, chapter}

  return (
    // TODO: how to make this the size of the chapter?
    <div className="relative">
      {
        // @ts-expect-error
        <Chapter books={books} reference={reference} />
      }
      <Notes reference={reference} />
    </div>
  )
}

const getData = async (version: string): Promise<{books: Books; chapters: NamedReference[]}> => {
  const url = `${CONFIG.API_URL}/chapters.json`

  const books: Books = await fetch(url).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error("No chapters"))
  )

  return {books, chapters: toChapters(version, books)}
}
