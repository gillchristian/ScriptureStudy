"use client"
import {atom, useAtom} from "jotai"

import {Editor} from "./Editor"
import {Window} from "./Window"

export const EditorAtom = atom(false)

export const FloatingEditor = () => {
  const [showEditor, setShowEditor] = useAtom(EditorAtom)

  return (
    <Window show={showEditor} onClose={() => setShowEditor(false)}>
      <div className="h-full w-full rounded-md bg-gray-50 p-4 shadow-lg dark:bg-gray-700 dark:text-white">
        <Editor />
      </div>
    </Window>
  )
}
