import {FocusEventHandler, useEffect} from "react"
import {BlockNoteEditor} from "@blocknote/core"
import {BlockNoteView} from "@blocknote/mantine"
import {useCreateBlockNote} from "@blocknote/react"

import {Output as OutputData, Block} from "@/models/editor"

import {CONFIG} from "@/config"
import {clsxm} from "@/lib/clsxm"

type Props = {
  editable?: boolean
  readOnly?: boolean
  initialData?: OutputData
  onChange: (data: OutputData) => void
  onReady?: (editor: BlockNoteEditor) => void
  onFocus?: FocusEventHandler<HTMLDivElement>
}

export default function Editor({editable = true, initialData, onChange, onReady, onFocus}: Props) {
  const editor = useCreateBlockNote(
    {
      initialContent: initialData?.blocks
    },
    []
  )

  useEffect(() => {
    onReady?.(editor)
  }, [])

  const newDocument = (blocks: Block[]) => editor.replaceBlocks(editor.document, blocks)

  return (
    <div className={clsxm(CONFIG.DEBUG_EDITOR && "debug-editor")} onFocus={onFocus}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => {
          onChange({
            version: "v1",
            time: Date.now(),
            blocks: editor.document
          })
        }}
      />
    </div>
  )
}
