"use client"

import {Books, Reference} from "@/models/reference"
import {useChapterEffects} from "@/hooks/chaperEffects"
import {Node} from "@/models/html"
import {useWindowSize} from "@/hooks/window"

import {Html} from "./Html"
import {ChapterNotes} from "./ChapterNotes"

type Props = {books: Books; reference: Reference; html: Node}

export const Chapter = ({books, reference, html}: Props) => {
  useChapterEffects({books, reference})

  const t = `${reference.version} | ${books.names[reference.book]} ${reference.chapter}`

  const {width} = useWindowSize()

  const _isLargeScreen = (width ?? 0) > 768

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-6 p-4">
      <div className="prose w-full flex-none pb-40 dark:prose-invert">
        <h2>{t}</h2>
        <Html node={html} version={reference.version} books={books} reference={reference} />
      </div>
      <div className="w-full">
        <ChapterNotes reference={reference} books={books} />
      </div>
    </div>
  )
}
