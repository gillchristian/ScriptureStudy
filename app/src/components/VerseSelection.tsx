"use client"

import * as S from "fp-ts/Set"
import * as A from "fp-ts/Array"
import {pipe} from "fp-ts/function"
import {useCallback, useMemo} from "react"
import {useAtom} from "jotai"

import {Books, Reference, Verse, verseEq, verseOrd} from "@/models/reference"

import {SelectedVerseAtom} from "./ChaperSideEffects"

type Props = {books: Books; reference: Reference}

const has = S.elem<Verse>(verseEq)
const remove = S.remove<Verse>(verseEq)
const insert = S.insert<Verse>(verseEq)

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

  return {verses: selectedVerses, formatted, isSelected, toggle, hasSelected, clear}
}

export const VerseSelection = ({books, reference}: Props) => {
  const {hasSelected, formatted} = useSelectedVerses()

  if (!hasSelected) return null

  return (
    <div className="fixed bottom-0 left-1/2 w-screen max-w-[70ch] -translate-x-1/2 transform shadow-md">
      <div className="space-y-4 rounded-t-lg bg-gray-200 px-4 py-8">
        <div className="flex items-center justify-center">
          <p>
            {books.names[reference.book]} {reference.chapter}:{formatted}
          </p>
        </div>
        {false && (
          <div className="flex w-full items-center justify-center space-x-6">
            <button className="h-8 w-8 rounded-full bg-yellow-200" />
            <button className="h-8 w-8 rounded-full bg-green-200" />
            <button className="h-8 w-8 rounded-full bg-red-200" />
          </div>
        )}
      </div>
    </div>
  )
}
