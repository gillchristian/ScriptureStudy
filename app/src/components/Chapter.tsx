"use client"

import {Books, Reference} from "@/models/reference"

import {Node, Html} from "./Html"
import {ChapterSideEffects} from "./ChaperSideEffects"
import {VerseSelection} from "./VerseSelection"
import {ChapterNotes} from "./ChapterNotes"

type Props = {books: Books; reference: Reference; html: Node}

export const Chapter = ({books, reference, html}: Props) => {
  return (
    <>
      <ChapterSideEffects books={books} reference={reference} />
      <div className="relative flex space-x-8">
        <div className="min-h-screen p-4">
          <div className="prose pb-40 dark:prose-invert">
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
          <ChapterNotes title="Notes" reference={reference} />
        </div>
      </div>
    </>
  )
}
