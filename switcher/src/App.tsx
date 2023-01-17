import {useAtom} from "jotai"

import {Controls} from "./Controls"
import {CommandPalette} from "./CommandPalette"
import {Chapter, ChapterAtom} from "./Chapter"

export function App() {
  const [_chapter, setChapter] = useAtom(ChapterAtom)

  const onChapterSelect = (version: string, chapter: string) => {
    setChapter({version, chapter: chapter.replace(/ /g, "-").toLowerCase()})
  }

  return (
    <>
      <Chapter />
      <CommandPalette
        mode="app"
        onChapterSelect={onChapterSelect}
        onToggleFootnotes={(on) => {
          if (on) {
            document.body.classList.remove("hide-footnotes")
          } else {
            document.body.classList.add("hide-footnotes")
          }
        }}
        onToggleVerses={(on) => {
          if (on) {
            document.body.classList.remove("hide-verses")
          } else {
            document.body.classList.add("hide-verses")
          }
        }}
      />
      <Controls mode="app" />
    </>
  )
}
