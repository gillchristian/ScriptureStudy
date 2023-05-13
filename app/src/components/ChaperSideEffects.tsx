"use client"

import * as S from "fp-ts/Set"
import {RefCallback, useCallback, useEffect} from "react"
import {atom, useAtom} from "jotai"
import {useSwipeable} from "react-swipeable"
import {usePathname, useSearchParams} from "next/navigation"

import {VisitedRecentlyAtom} from "@/models/atoms"
import {
  Books,
  eqReference,
  findNext,
  findPrev,
  NamedReference,
  Reference,
  Verse,
  verseEq
} from "@/models/reference"
import {useRouter} from "@/lib/router-events"

import {CommandPaletteAtom} from "./CommandPalette"

type Props = {books: Books; reference: Reference}

export const ChapterSideEffects = (props: Props) => {
  useTrackRecentChapters(props)
  usePrefetchPrevAndNext(props)
  useSwipePrevNext(props)
  useClearSelectedVerses()

  return null
}

export const SelectedVerseAtom = atom<Set<Verse>>(new Set([]))

const has = S.elem<Verse>(verseEq)
const remove = S.remove<Verse>(verseEq)
const insert = S.insert<Verse>(verseEq)

// Verse: <prop>:<book>-<chapter>-<verse>
export const parseVerse = (books: Books, verse_: string): Verse & {version: string} => {
  const [version, bookShort, chapter, verse] = verse_.split("-")

  return {
    version,
    book: books.by_short[bookShort],
    chapter: parseInt(chapter, 10),
    verse: parseInt(verse, 10)
  }
}

export const useSelectedVerses = () => {
  const [selectedVerses, setSelectedVerses] = useAtom(SelectedVerseAtom)

  const toggle = useCallback(
    (verse: Verse) => {
      setSelectedVerses((vs) => (has(verse)(vs) ? remove(verse)(vs) : insert(verse)(vs)))
    },
    [setSelectedVerses]
  )

  const isSelected = useCallback((verse: Verse) => has(verse)(selectedVerses), [selectedVerses])

  return {isSelected, toggle}
}

export function useOnComplete() {}

const useClearSelectedVerses = () => {
  // On ESC press
  const [isCommandPalletOpen] = useAtom(CommandPaletteAtom)
  const [_, setSelectedVerses] = useAtom(SelectedVerseAtom)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isCommandPalletOpen && e.key === "Escape") {
        setSelectedVerses(new Set([]))
      }
    }

    document.addEventListener("keydown", handler)

    return () => {
      document.removeEventListener("keydown", handler)
    }
  }, [isCommandPalletOpen])

  // On route change
  // TODO: should it run on search params change?
  // TODO: maybe this should be done based on props.reference changing instead of pathname
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    setSelectedVerses(new Set([]))
  }, [pathname, searchParams])
}

const useTrackRecentChapters = ({books, reference}: Props) => {
  const {version, book, chapter} = reference

  const insertMostRecent = (chapter: NamedReference) =>
    setRecent((recent) => [
      {time: Date.now(), reference: chapter},
      ...recent.filter((c) => !eqReference.equals(c.reference, chapter)).slice(0, 1000)
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

const usePrefetchPrevAndNext = ({books, reference}: Props) => {
  const {version, book, chapter} = reference

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

const useSwipePrevNext = ({books, reference}: Props) => {
  const {version, book, chapter} = reference

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
