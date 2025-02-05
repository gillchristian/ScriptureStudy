import {useSelectedLayoutSegments} from "next/navigation"

import {Reference} from "./reference"

export type Route =
  | {tag: "history"}
  | {tag: "highlights"}
  | {tag: "home"}
  | {tag: "not_found"}
  | ({tag: "chapter"} & Reference)
  | ({tag: "notes"} & Reference)
  | ({tag: "next"} & Reference)

export type RouteTag = Route["tag"]

export const useRoute = (): Route => {
  const [a, b, c, d] = useSelectedLayoutSegments()

  if (!a) {
    return {tag: "home"}
  }

  if (a === "history") {
    return {tag: "history"}
  }

  if (a === "highlights") {
    return {tag: "highlights"}
  }

  if (a === "notes" && b && c && d) {
    return {tag: "notes", version: b, book: c, chapter: chapter(d)}
  }

  if (a === "next" && b && c && d) {
    return {tag: "next", version: b, book: c, chapter: chapter(d)}
  }

  if (b && c) {
    return {tag: "chapter", version: a, book: b, chapter: chapter(c)}
  }

  return {tag: "not_found"}
}

const chapter = (c: string) => {
  const chapter_ = parseInt(c, 10)
  return Number.isNaN(chapter_) ? 1 : chapter_
}
