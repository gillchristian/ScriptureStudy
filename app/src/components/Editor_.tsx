import {FocusEventHandler} from "react"
import {BlockNoteEditor} from "@blocknote/core"
import {BlockNoteView, useBlockNote} from "@blocknote/react"

import {Output as OutputData} from "@/models/editor"

import {CONFIG} from "@/config"
import {clsxm} from "@/lib/clsxm"

type Props = {
  editable?: boolean
  readOnly?: boolean
  autofocus?: boolean
  initialData?: OutputData
  onChange: (data: OutputData) => void
  onReady?: (editor: BlockNoteEditor) => void
  onFocus?: FocusEventHandler<HTMLDivElement>
}

export default function Editor({
  editable = true,
  initialData,
  autofocus,
  onChange,
  onReady,
  onFocus
}: Props) {
  const editor: BlockNoteEditor | null = useBlockNote(
    {
      editable,
      initialContent: initialData?.blocks ?? [],
      onEditorContentChange: (editor) => {
        onChange({
          version: "v1",
          time: Date.now(),
          blocks: editor.topLevelBlocks
        })
      },
      onEditorReady: (editor) => {
        if (autofocus) {
          editor.domElement?.focus()
        }

        onReady?.(editor)
      }
    },
    []
  )

  return (
    <div className={clsxm("reset", CONFIG.DEBUG_EDITOR && "debug-editor")} onFocus={onFocus}>
      <BlockNoteView editor={editor} />
    </div>
  )
}
