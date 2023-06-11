"use client"
import {atom, useAtom} from "jotai"

import {Editor} from "./Editor"
import {Window} from "./Window"

export const EditorAtom = atom(false)

export const FloatingEditor = () => {
  const [showEditor, _setShowEditor] = useAtom(EditorAtom)

  return (
    <Window show={showEditor}>
      <div className="z-50 h-full w-full rounded-md bg-gray-50 p-4 shadow-lg">
        <Editor />
      </div>
    </Window>
  )
}
