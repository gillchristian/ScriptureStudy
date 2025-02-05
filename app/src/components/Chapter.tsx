"use client"
import {useAtom} from "jotai"

import {Books, Reference} from "@/models/reference"
import {useChapterEffects} from "@/hooks/chaperEffects"
import {useWindowSize} from "@/hooks/window"
import {Node} from "@/models/html"

import {Html} from "./Html"
import {VerseSelection} from "./VerseSelection"
import {ChapterNotes} from "./ChapterNotes"
import {EditorAtom} from "./FloatingEditor"

type Props = {books: Books; reference: Reference; html: Node}

export const Chapter = ({books, reference, html}: Props) => {
  useChapterEffects({books, reference})

  const {width} = useWindowSize()
  const [showEditor, _setShowEditor] = useAtom(EditorAtom)

  const showSingleColumn = (width ?? 0) <= 768

  const t = `${reference.version} | ${books.names[reference.book]} ${reference.chapter}`

  if (showSingleColumn && showEditor) {
    return (
      <div className="relative min-h-screen w-full max-w-prose p-4">
        <ChapterNotes title={t} reference={reference} books={books} />
      </div>
    )
  }

  if (showSingleColumn && !showEditor) {
    return (
      <div className="min-h-screen w-full max-w-prose p-4">
        <div className="prose pb-40 dark:prose-invert">
          <h2>{t}</h2>
          <Html node={html} version={reference.version} books={books} reference={reference} />
        </div>

        <VerseSelection books={books} reference={reference} />
      </div>
    )
  }

  return (
    <div className="relative flex space-x-8">
      <div className="min-h-screen w-full p-4">
        <div className="prose max-w-prose pb-40 dark:prose-invert">
          <h2>
            {reference.version}
            {" | "}
            {books.names[reference.book]} {reference.chapter}
          </h2>
          <Html node={html} version={reference.version} books={books} reference={reference} />
        </div>

        <VerseSelection books={books} reference={reference} />
      </div>

      <div className="relative min-h-screen w-full max-w-prose p-4">
        <ChapterNotes title="Notes" reference={reference} books={books} />
      </div>
    </div>
  )
}
