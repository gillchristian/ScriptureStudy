"use client"
import {useAtom} from "jotai"

import {VisitedRecentlyAtom} from "@/models/atoms"
import {Books, eqReference, NamedReference, Reference} from "@/models/reference"
import {useEffect} from "react"

type Props = {books: Books} & Reference

export const RecordVisitedChapter = ({books, version, book, chapter}: Props) => {
  const insertMostRecent = (chapter: NamedReference) =>
    setRecent((recent) => [
      {time: Date.now(), reference: chapter},
      ...recent.filter((c) => !eqReference.equal(c.reference, chapter)).slice(0, 1000)
    ])

  const [_recent, setRecent] = useAtom(VisitedRecentlyAtom)

  useEffect(() => {
    const i = setTimeout(() => {
      const name = `${books.names[book]} ${chapter}`

      insertMostRecent({tag: "chapter", name, version, book, chapter})
    }, 10000)

    return () => {
      clearInterval(i)
    }
  }, [version, book, chapter])

  return null
}
