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
  const [note, setNote] = useState<Output>()
  const [_ready, setReady] = useState(false)
  const editorRef = useRef<BlockNoteEditor>()

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

  // TODO: should be an upsert operation to replace the current one instead
  const save = async () => {
    if (!editorRef.current || !note) {
      return
    }

    const html = await editorRef.current.blocksToHTML(note.blocks)
    const text = await editorRef.current.blocksToMarkdown(note.blocks)

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
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (note) {
      save()
    }
  }, [note])

  if (!showEditor) {
    return null
  }

  console.log(data)

  const noteContents =
    data?.table[`${reference.version}-${reference.book}-${reference.chapter}`]?.comment?.json

  return (
    <div className="sticky top-4 space-y-6">
      <div className="prose dark:prose-invert">
        <h2>{title}</h2>
      </div>

      {isLoading ? (
        <div className="h-8 w-full animate-pulse rounded-lg bg-gray-500" />
      ) : (
        <Editor_ notes={noteContents} reference={reference} />
      )}
    </div>
  )
}

type EditorProps = {
  notes?: Output
  reference: Reference
}

const Editor_ = ({notes: persistedNotes, reference}: EditorProps) => {
  const [note, setNote] = useState<Output>()
  const [_ready, setReady] = useState(false)
  const editorRef = useRef<BlockNoteEditor>()

  const [token, _] = useAtom(TokenAtom)

  const save = async () => {
    if (!editorRef.current || !note) {
      return
    }

    const html = await editorRef.current.blocksToHTML(note.blocks)
    const text = await editorRef.current.blocksToMarkdown(note.blocks)

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
      onChange={(v) => {
        setNote(v)
      }}
      initialData={persistedNotes}
      autofocus={true}
      readOnly={false}
      onReady={(editor) => {
        setReady(true)
        editorRef.current = editor
      }}
    />
  )
}
