"use client"
import {useAtom} from "jotai"
import {useRouter} from "next/navigation"

import {VisitedRecentlyAtom} from "@/models/atoms"
import {Books, eqReference, findNext, findPrev, NamedReference, Reference} from "@/models/reference"
import {useEffect} from "react"

type Props = {books: Books} & Reference

export const ChapterSideEffects = (props: Props) => {
  useTrackRecentChapters(props)
  usePrefetchPrevAndNext(props)

  return null
}

const useTrackRecentChapters = ({books, version, book, chapter}: Props) => {
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
}

const usePrefetchPrevAndNext = ({books, version, book, chapter}: Props) => {
  const router = useRouter()
  useEffect(() => {
    const prev = findPrev({version, book, chapter}, books)
    if (prev) {
      router.prefetch(`/${prev.version}/${prev.book}/${prev.chapter}`)
    }

    const next = findNext({version, book, chapter}, books)
    if (next) {
      router.prefetch(`/${next.version}/${next.book}/${next.chapter}`)
    }
  }, [])
}
