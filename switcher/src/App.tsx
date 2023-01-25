import {useAtom} from "jotai"

import {Controls} from "./Controls"
import {CommandPalette} from "./CommandPalette"
import {Chapter, ChapterAtom} from "./Chapter"
import {atomWithStorage} from "jotai/utils"
import {useEffect} from "react"
import {CONFIG} from "./config"

type Chapters = {
  byCount: {[chapter: string]: number}
  inOrder: string[]
}

const STRUCTURE_KEY = "ScriptureStudy__structure"
const StructureAtom = atomWithStorage<Chapters | undefined>(
  STRUCTURE_KEY,
  undefined
)

const toggleFootnotes = (on: boolean) => {
  if (on) {
    document.body.classList.remove("hide-footnotes")
  } else {
    document.body.classList.add("hide-footnotes")
  }
}

const toggleVerses = (on: boolean) => {
  if (on) {
    document.body.classList.remove("hide-verses")
  } else {
    document.body.classList.add("hide-verses")
  }
}

const findPrev = (current_: string, chapters: Chapters) => {
  const [chapter_, ...name_] = current_.toLowerCase().split(" ").reverse()

  const current = {book: name_.reverse().join(" "), chapter: parseInt(chapter_)}

  const i = chapters.inOrder.findIndex((b) => b.toLowerCase() === current.book)

  const book = chapters.inOrder[i]
  const prev = chapters.inOrder[i - 1]

  if (current.chapter === 1) {
    return prev ? `${prev} ${chapters.byCount[prev]}` : undefined
  }

  return `${book} ${current.chapter - 1}`
}

const findNext = (current_: string, chapters: Chapters) => {
  const [chapter_, ...name_] = current_.toLowerCase().split(" ").reverse()

  const current = {book: name_.reverse().join(" "), chapter: parseInt(chapter_)}

  const i = chapters.inOrder.findIndex((b) => b.toLowerCase() === current.book)

  const book = chapters.inOrder[i]
  const next = chapters.inOrder[i + 1]

  if (chapters.byCount[book] === current.chapter) {
    return next ? `${next} 1` : undefined
  }

  return `${book} ${current.chapter + 1}`
}

export function App() {
  const [chapter, setChapter] = useAtom(ChapterAtom)
  const [chapters, setChapters] = useAtom(StructureAtom)

  const onChapterSelect = (version: string, chapter: string) => {
    setChapter({version, chapter: chapter.replace(/ /g, "-").toLowerCase()})
  }

  const onPrevChapter = () => {
    if (!chapters) {
      return
    }

    setChapter((current) => {
      const prev = findPrev(current.chapter.replace(/-/g, " "), chapters)
      return prev ? {chapter: prev, version: chapter.version} : current
    })
  }

  const onNextChapter = () => {
    if (!chapters) {
      return
    }

    setChapter((current) => {
      const next = findNext(current.chapter.replace(/-/g, " "), chapters)
      return next ? {chapter: next, version: chapter.version} : current
    })
  }

  useEffect(() => {
    fetch(`${CONFIG.API_URL}/chapters.json`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("No chapters"))
      )
      .then(setChapters)
      .catch((err) => {
        console.error(err)
      })
  }, [])

  return (
    <>
      <Chapter />
      {chapters && (
        <CommandPalette
          appMode="app"
          onChapterSelect={onChapterSelect}
          onToggleFootnotes={toggleFootnotes}
          onToggleVerses={toggleVerses}
          onPrevChapter={onPrevChapter}
          onNextChapter={onNextChapter}
        />
      )}
      <Controls mode="app" />
    </>
  )
}
