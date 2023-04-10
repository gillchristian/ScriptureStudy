import {CONFIG} from "@/config"
import {Books, Reference} from "@/models/reference"

import {Node, Html} from "./Html"
import {ChapterSideEffects} from "./ChaperSideEffects"

type Props = {books: Books; reference: Reference}

export const Chapter = async ({books, reference}: Props) => {
  const {html} = await getData(reference)

  if (!html) {
    return (
      <div className="mx-auto flex min-h-screen w-full justify-center p-4">
        <div className="prose dark:prose-invert">
          <p>...</p>
        </div>
      </div>
    )
  }

  const current = `${books.short[reference.book]}-${reference.chapter}-`

  return (
    <>
      <ChapterSideEffects
        books={books}
        version={reference.version}
        book={reference.book}
        chapter={reference.chapter}
      />

      <div className="mx-auto flex min-h-screen w-full justify-center p-4">
        <div className="prose pb-40 dark:prose-invert">
          <h2>
            {reference.version}
            {" | "}
            {books.names[reference.book]} {reference.chapter}
          </h2>
          <Html node={html} current={current} />
        </div>
      </div>
    </>
  )
}

const getData = async ({version, book, chapter}: Reference): Promise<{html?: Node}> => {
  const url = `${CONFIG.API_URL}/${version}/${book}-${chapter}.json`

  const html = await fetch(url)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))))
    .catch(() => undefined)

  return {html}
}
