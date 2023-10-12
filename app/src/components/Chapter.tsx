"use client"

import {Books, Reference} from "@/models/reference"

import {Node, Html} from "./Html"
import {FloatingEditor} from "./FloatingEditor"
import {ChapterSideEffects} from "./ChaperSideEffects"
import {VerseSelection} from "./VerseSelection"

type Props = {books: Books; reference: Reference; html: Node}

export const Chapter = ({books, reference, html}: Props) => {
  return (
    <>
      <ChapterSideEffects books={books} reference={reference} />
      <FloatingEditor />

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
    </>
  )
}
