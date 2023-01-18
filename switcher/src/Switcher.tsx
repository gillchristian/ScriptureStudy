import {Controls} from "./Controls"
import {CommandPalette} from "./CommandPalette"

const onChapterSelect = (version: string, chapter: string) =>
  window.location.assign(
    `/${version}/${chapter.replace(/ /g, "-").toLowerCase()}.html`
  )

export function Switcher() {
  return (
    <>
      <CommandPalette
        appMode="controls_only"
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
      <Controls mode="controls_only" />
    </>
  )
}
