import {atomWithStorage} from "jotai/utils"

import {NamedReference} from "./reference"

type HistoryEntry = {
  time: number
  reference: NamedReference
}

const VISITED_RECENTLY_KEY = "ScriptureStudy__visited_recently_v4"
export const VisitedRecentlyAtom = atomWithStorage<HistoryEntry[]>(VISITED_RECENTLY_KEY, [])
