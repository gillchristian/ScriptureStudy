import {useState, useRef, useCallback, useEffect} from "react"
import {BlockNoteEditor} from "@blocknote/core"
import {useAtom} from "jotai"
import useSWR from "swr"

import {Editor} from "@/components/Editor"
import {Output} from "@/models/editor"
import {Reference} from "@/models/reference"
import {TokenAtom} from "@/models/token"

import {EditorAtom} from "./FloatingEditor"
import {AddComment, Comment, addComment, getChapterComments} from "@/models/comments"

type Props = {
  title: string
  reference: Reference
}

export const ChapterNotes = ({title, reference}: Props) => {
  const [showEditor, _setShowEditor] = useAtom(EditorAtom)

  const [token, _] = useAtom(TokenAtom)

  const fetcher = useCallback(
    (_key: string) => getChapterComments(token, reference),
    [token, reference.version, reference.book, reference.chapter]
  )

  const {data, isLoading, mutate} = useSWR<{comments: Comment[]; table: Record<string, Comment>}>(
    `chapter-comment-${reference.version}-${reference.book}-${reference.chapter}`,
    fetcher
  )

  if (!showEditor) {
    return null
  }

  const noteContents =
    data?.table[`${reference.version}-${reference.book}-${reference.chapter}`]?.comment?.json

  return (
    <div className="sticky top-4 space-y-6">
      <div className="prose dark:prose-invert">
        <h2>{title}</h2>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-gray-500">...</div>
      ) : (
        <Editor_ notes={noteContents} reference={reference} onSaved={mutate} />
      )}
    </div>
  )
}

type EditorProps = {
  notes?: Output
  reference: Reference
  onSaved: () => void
}

const Editor_ = ({notes: persistedNotes, reference, onSaved}: EditorProps) => {
  const [note, setNote] = useState<Output>()
  const [_ready, setReady] = useState(false)
  const editorRef = useRef<BlockNoteEditor>(null)

  const [token, _] = useAtom(TokenAtom)

  const save = async () => {
    if (!editorRef.current || !note || !token) {
      return
    }

    const html = await editorRef.current.blocksToFullHTML(note.blocks)
    const text = await editorRef.current.blocksToMarkdownLossy(note.blocks)

    const comment: AddComment = {
      version: reference.version,
      book: reference.book,
      chapter: reference.chapter,
      verses: [],
      comment: {
        html,
        text,
        json: note
      },
      public: false
    }

    try {
      await addComment(token, comment)
      onSaved()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (note) {
      save()
    }
  }, [note])

  return (
    <Editor
      onChange={(v) => setNote(v)}
      initialData={persistedNotes}
      readOnly={false}
      onReady={(editor) => {
        console.log("ready", editor)
        setReady(true)
        editorRef.current = editor
      }}
    />
  )
}
