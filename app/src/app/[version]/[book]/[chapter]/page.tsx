import {CONFIG} from "@/config"
import {Chapter} from "@/components/Chapter"
import {getIndex} from "@/lib/bibleIndex"
import type {Node} from "@/components/Html"
import type {Reference} from "@/models/reference"

type Params = {
  version: string
  book: string
  chapter: string
}

type Props = {params: Params}

export default async function ChapterPage({params}: Props) {
  const chapter_ = parseInt(params.chapter, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_
  const reference = {version: params.version, book: params.book, chapter}

  const [{books}, {html}] = await Promise.all([getIndex(params.version), getChapter(reference)])

  if (!html) {
    return (
      <div className="relative">
        <div className="min-h-screen p-4">
          <div className="prose dark:prose-invert">
            <p>Failed to load chapter</p>
          </div>
        </div>
      </div>
    )
  }

  return <Chapter books={books} reference={reference} html={html} />
}

const getChapter = async ({version, book, chapter}: Reference): Promise<{html?: Node}> => {
  const url = `${CONFIG.BIBLES_URL}/${version}/${book}-${chapter}.json`

  const html = await fetch(url)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))))
    .catch(() => undefined)

  return {html}
}
