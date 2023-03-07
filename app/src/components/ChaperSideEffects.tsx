"use client"
import {useAtom} from "jotai"
import {useRouter} from "next/navigation"
import {useSwipeable} from "react-swipeable"

import {VisitedRecentlyAtom} from "@/models/atoms"
import {Books, eqReference, findNext, findPrev, NamedReference, Reference} from "@/models/reference"
import {RefCallback, useCallback, useEffect} from "react"

type Props = {books: Books} & Reference

export const ChapterSideEffects = (props: Props) => {
  useTrackRecentChapters(props)
  usePrefetchPrevAndNext(props)
  useSwipePrevNext(props)

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

const useSwipePrevNext = ({books, version, book, chapter}: Props) => {
  const router = useRouter()

  const prev = useCallback(() => {
    const prev = findPrev({version, book, chapter}, books)
    if (prev) {
      router.push(`/${prev.version}/${prev.book}/${prev.chapter}`)
    }
  }, [books, version, book, chapter])

  const next = useCallback(() => {
    const next = findNext({version, book, chapter}, books)
    if (next) {
      router.push(`/${next.version}/${next.book}/${next.chapter}`)
    }
  }, [books, version, book, chapter])

  const {ref} = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    swipeDuration: 500,
    preventScrollOnSwipe: true,
    trackMouse: true
  }) as {ref: RefCallback<Document>}

  useEffect(() => {
    ref(document)
  }, [])
}
