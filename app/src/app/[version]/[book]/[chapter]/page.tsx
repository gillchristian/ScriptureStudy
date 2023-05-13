import {Chapter} from "@/components/Chapter"
import {getIndex} from "@/lib/bibleIndex"

type Params = {
  version: string
  book: string
  chapter: string
}

type Props = {params: Params}

export default async function ChapterPage({params}: Props) {
  const {books} = await getIndex(params.version)

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
    </div>
  )
}
