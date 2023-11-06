import {useSelectedLayoutSegments} from "next/navigation"

import {Reference} from "./reference"

export type Route =
  | {tag: "history"}
  | {tag: "home"}
  | {tag: "not_found"}
  | ({tag: "chapter"} & Reference)

export type RouteTag = Route["tag"]

export const useRoute = (): Route => {
  const [a, b, c] = useSelectedLayoutSegments()

  if (!a) {
    return {tag: "home"}
  }

  if (a === "history") {
    return {tag: "history"}
  }

  if (!b || !c) {
    return {tag: "not_found"}
  }

  const chapter_ = parseInt(c, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_

  return {tag: "chapter", version: a, book: b, chapter}
}
