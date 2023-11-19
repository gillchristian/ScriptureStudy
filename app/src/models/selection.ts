import {useEffect} from "react"

import {Verse} from "./reference"

const SELECT_EVENT = "verse-selected"
const CLEAR_EVENT = "clear-selected-verses"

export const emitClearSelectedVerses = () => document.dispatchEvent(new Event(CLEAR_EVENT))

export const emitVerseSelected = (verse: Verse) =>
  document.dispatchEvent(new CustomEvent(SELECT_EVENT, {detail: verse}))

export const useOnClearSelectedVerses = (cb: () => void) =>
  useEffect(() => {
    const handler = () => {
      cb()
    }

    document.addEventListener(CLEAR_EVENT, handler)

    return () => {
      document.removeEventListener(CLEAR_EVENT, handler)
    }
  }, [])

export const useOnVerseSelected = (cb: (verse: Verse) => void) =>
  useEffect(() => {
    const handler = (event: CustomEvent<Verse>) => {
      cb(event.detail)
    }

    // @ts-expect-error
    document.addEventListener(SELECT_EVENT, handler)

    return () => {
      // @ts-expect-error
      document.removeEventListener(SELECT_EVENT, handler)
    }
  }, [])
