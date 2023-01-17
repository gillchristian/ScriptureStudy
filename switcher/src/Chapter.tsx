import {useAtom} from "jotai"
import {atomWithStorage} from "jotai/utils"
import {useEffect, useState} from "react"

import {Element, Html} from "./Html"
import {Eq} from "./Eq"
import {VERSIONS} from "./options"
import {CONFIG} from "./config"

type ChapterOpt = {
  version: string
  chapter: string
}

export const eqChapter: Eq<ChapterOpt> = {
  equal: (a, b) =>
    a.version === b.version
      ? a.chapter.toLowerCase().replace(/[- ]/g, "") ===
        b.chapter.toLowerCase().replace(/[- ]/g, "")
      : false
}

const defaultChapter: ChapterOpt = {version: "NLT", chapter: "genesis-1"}

export const fromPath = (): ChapterOpt => {
  const [version, chapter] = window.location.pathname.split("/").filter(Boolean)

  if (!VERSIONS.includes(version) || !chapter) {
    return defaultChapter
  }

  return {version, chapter: chapter.replace(".html", "")}
}

const CHAPTER_ATOM_KEY = "ScriptureStudy__selected_chapter"
// TODO: keep this in the url instead
export const ChapterAtom = atomWithStorage(CHAPTER_ATOM_KEY, defaultChapter)

export const Chapter = () => {
  const [loading, setLoading] = useState(false)
  const [error, setErr] = useState<string>()
  const [html, setHtml] = useState<Element>()
  const [{version, chapter}, _setChapter] = useAtom(ChapterAtom)

  useEffect(() => {
    setLoading(true)

    fetch(`${CONFIG.API_URL}/${version}/${chapter}.json`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))
      )
      .then((json) => setHtml(json))
      .then(() => setLoading(false))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unknown error"

        setErr(msg)
        setLoading(false)
      })
  }, [chapter, version])

  if (loading) {
    return (
      <div className="flex justify-center mx-auto w-full items-center">
        <div className="prose">Loading ...</div>
      </div>
    )
  }

  if (html) {
    return (
      <div className="flex justify-center mx-auto w-full min-h-screen items-center p-4 bg-stone-100">
        <div className="prose">
          <h2>
            {version} {"|"}{" "}
            {chapter
              .split("-")
              .map((c) => `${c.charAt(0).toUpperCase()}${c.substring(1)}`)
              .join(" ")}
          </h2>
          <Html node={html} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center mx-auto w-full items-center">
      <div className="prose">{error ?? "Unkown error"}</div>
    </div>
  )
}
