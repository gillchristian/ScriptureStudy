"use client"

import * as S from "fp-ts/Set"
import * as A from "fp-ts/Array"
import {pipe} from "fp-ts/function"
import {useCallback, useMemo} from "react"
import {useAtom} from "jotai"
import useSWR from "swr"

import {Books, Reference, Verse, verseEq, verseOrd, VerseWithVersion} from "@/models/reference"

import {SelectedVerseAtom} from "./ChaperSideEffects"
import {XMarkIcon} from "@heroicons/react/24/outline"
import {createHighlight, deleteHighlight, getHighlights, Highlight} from "@/models/highlight"

export const useHighlights = (version: string, book: string, chapter: number) => {
  const fetcher = useCallback(
    (_key: string) => getHighlights(version, book, chapter),
    [version, book, chapter]
  )

  const {data, mutate} = useSWR<{highlights: Highlight[]; table: Record<string, Highlight>}>(
    `${version}-${book}-${chapter}`,
    fetcher
  )

  const highlights = useMemo(() => data?.highlights ?? [], [data])
  const table = useMemo(() => data?.table ?? {}, [data])

  const isHighLighted = useCallback(
    (verse: VerseWithVersion) =>
      highlights.some(
        (h) =>
          h.version === verse.version &&
          h.book === verse.book &&
          h.chapter === verse.chapter &&
          h.verses.includes(verse.verse)
      ),
    [highlights]
  )

  return {highlights, table, mutate, isHighLighted}
}

const useHighLightedVerses = (reference: Reference) => {
  const {highlights, mutate, isHighLighted} = useHighlights(
    reference.version,
    reference.book,
    reference.chapter
  )

  const [_, setSelectedVerses] = useAtom(SelectedVerseAtom)

  const highlight = useCallback(
    (verses: Verse[], version: string, color: string) => {
      const verses_ = verses.map((v) => v.verse)

      createHighlight(version, reference.book, reference.chapter, verses_, color).then(
        (highlight) => {
          if (highlight) {
            mutate()
            setSelectedVerses(new Set([]))
          }
        }
      )
    },
    [highlights]
  )

  const remove = useCallback(
    (toDelete: Highlight[]) => {
      Promise.all(toDelete.map((highlight) => deleteHighlight(highlight))).then(() => {
        mutate()
      })

      setSelectedVerses(new Set([]))
    },
    [highlights]
  )

  return {highlights, highlight, remove, isHighLighted}
}

const has = S.elem<Verse>(verseEq)
const remove = S.remove<Verse>(verseEq)
const insert = S.insert<Verse>(verseEq)

export const useVerseToggler = () => {
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

const useSelectedVerses = () => {
  const [selectedVerses, setSelectedVerses] = useAtom(SelectedVerseAtom)

  const toggle = useCallback(
    (verse: Verse) => {
      setSelectedVerses((vs) => (has(verse)(vs) ? remove(verse)(vs) : insert(verse)(vs)))
    },
    [setSelectedVerses]
  )

  const isSelected = useCallback((verse: Verse) => has(verse)(selectedVerses), [selectedVerses])

  const hasSelected = useMemo(() => selectedVerses.size > 0, [selectedVerses])

  const clear = useCallback(() => setSelectedVerses(new Set([])), [setSelectedVerses])

  const formatted = useMemo(() => {
    const sorted = pipe([...selectedVerses], A.sort(verseOrd))

    if (sorted.length === 0) {
      return ""
    }

    type State = {ranges: Verse[][]; current: Verse[]; last: Verse}
    const state: State = {ranges: [], current: [sorted[0]], last: sorted[0]}

    const {ranges, current} = sorted.slice(1).reduce(
      (state, verse) => {
        if (verse.verse === state.last.verse + 1) {
          state.current.push(verse)
        } else {
          state.ranges.push(state.current)
          state.current = [verse]
        }

        state.last = verse

        return state
      },

      state
    )

    const formatted = [...ranges, current].reduce(
      (acc, range) =>
        range.length === 0
          ? acc
          : range.length === 1
          ? `${acc},${range[0].verse}`
          : `${acc},${range[0].verse}-${range[range.length - 1].verse}`,
      ""
    )

    return formatted.replace(/^,/, "")
  }, [selectedVerses])

  const verses_ = useMemo(() => [...selectedVerses], [selectedVerses])

  return {verses: selectedVerses, verses_, formatted, isSelected, toggle, hasSelected, clear}
}

type Props = {books: Books; reference: Reference}

export const VerseSelection = ({books, reference}: Props) => {
  const {hasSelected, verses_, formatted} = useSelectedVerses()
  const {highlight, remove, isHighLighted, highlights} = useHighLightedVerses(reference)

  const highlightSelected = (color: string) => {
    highlight(verses_, reference.version, color)
  }

  const removeSelected = () => {
    remove(
      verses_.flatMap((v) =>
        highlights.filter(
          (h) => h.book === v.book && h.chapter === v.chapter && h.verses.includes(v.verse)
        )
      )
    )
  }

  if (!hasSelected) return null

  const selectedHighLightedVerses = verses_.some((v) =>
    isHighLighted({...v, version: reference.version})
  )

  return (
    <div className="fixed bottom-0 left-1/2 w-screen max-w-[70ch] -translate-x-1/2 transform shadow-md">
      <div className="space-y-4 rounded-t-lg bg-gray-200 px-4 py-8">
        <div className="flex items-center justify-center">
          <p>
            {books.names[reference.book]} {reference.chapter}:{formatted}
          </p>
        </div>
        <div className="flex w-full items-center justify-center space-x-6">
          {selectedHighLightedVerses && (
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200"
              onClick={removeSelected}
            >
              <XMarkIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
          <button
            className="h-8 w-8 rounded-full bg-yellow-200"
            onClick={() => highlightSelected("yellow")}
          />
          <button
            className="h-8 w-8 rounded-full bg-red-200"
            onClick={() => highlightSelected("red")}
          />
          <button
            className="h-8 w-8 rounded-full bg-green-200"
            onClick={() => highlightSelected("green")}
          />
        </div>
      </div>
    </div>
  )
}
