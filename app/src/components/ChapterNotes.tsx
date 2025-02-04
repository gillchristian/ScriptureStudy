import {useState, useRef, useEffect, useMemo} from "react"
import {BlockNoteEditor} from "@blocknote/core"
import {useAtom} from "jotai"
import useSWR from "swr"
import * as A from "fp-ts/Array"
import format from "date-fns/format"

import {Editor} from "@/components/Editor"
import {Output} from "@/models/editor"
import {Books, Reference, formatVerses} from "@/models/reference"
import {TokenAtom} from "@/models/token"
import {AddComment, Comment, addComment, getChapterComments, getCommentOrd} from "@/models/comments"
import {useOnClearSelectedVerses, useOnVerseSelected} from "@/models/selection"

import {EditorAtom} from "./FloatingEditor"
import {useSelectedVerses} from "./VerseSelection"

type Props = {
  books: Books
  title: string
  reference: Reference
}

type Data = {
  comments: Comment[]
  table: Record<string, Comment>
  chapterNotes: Comment[]
  verseNotes: Comment[]
}

const mkFetcher =
  (token: string, reference: Reference, books: Books) =>
  async (_key: string): Promise<Data> => {
    if (!token?.trim()) {
      throw new Error("No token")
    }

    const {comments, table} = await getChapterComments(token, reference)

    const comments_ = A.sort(getCommentOrd(books))(comments)

    const chapterNotes = A.takeLeftWhile((c: Comment) => c.verses.length === 0)(comments_)
    const verseNotes = A.dropLeftWhile((c: Comment) => c.verses.length === 0)(comments_)

    return {comments, chapterNotes, verseNotes, table}
  }

const mkKey = (reference: Reference, verses: number[]) =>
  `${reference.version}.${reference.book}.${reference.chapter}.${verses.join("-")}`

export const ChapterNotes = ({title, reference, books}: Props) => {
  // TODO: this should be some form of global state instead
  const {verses_, clear, toggle} = useSelectedVerses()
  useOnClearSelectedVerses(clear)
  useOnVerseSelected(toggle)

  const [showEditor, setShowEditor] = useAtom(EditorAtom)

  const [editingKey, setEditingKey] = useState<string>()

  const [token, _] = useAtom(TokenAtom)

  const {data, isLoading, mutate} = useSWR<Data>(
    `chapter-comment-${reference.version}-${reference.book}-${reference.chapter}`,
    mkFetcher(token, reference, books)
  )

  // TODO: is this caching working correctly?
  const verses = useMemo(() => verses_.map((v) => v.verse).sort((a, b) => a - b), [verses_])

  // The trailing `-` is fine, it's handled in the same way by `@/models/comments`
  const key = `${reference.version}.${reference.book}.${reference.chapter}.${verses.join("-")}`

  const hasNote = Boolean(data?.table[key])

  const chapterNotes = data?.chapterNotes ?? []
  const verseNotes = data?.verseNotes ?? []

  const onEdit = (c: Comment) => {
    setEditingKey(mkKey(c, verses))
    setShowEditor(true)
  }

  const onNew = () => {
    setEditingKey(mkKey(reference, verses))
    setShowEditor(true)
  }

  const onSave = () => {
    setEditingKey(undefined)
    setShowEditor(false)
    mutate()
  }

  return (
    // many notes
    <div className="sticky top-4 flex max-h-screen flex-col space-y-6">
      <div className="prose dark:prose-invert">
        <h2>{title}</h2>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-gray-500">...</div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-8">
              {hasNote ? null : editingKey ? (
                <Editor_ reference={reference} verses={verses} onSaved={onSave} />
              ) : (
                <button
                  className="my-2 text-gray-400 dark:text-gray-600"
                  type="button"
                  onClick={onNew}
                >
                  Add a note ...
                </button>
              )}

              {chapterNotes.map((c) => (
                <ChapterNote
                  key={c.id}
                  reference={reference}
                  comment={c}
                  isEditing={editingKey === mkKey(c, c.verses)}
                  onEdit={() => onEdit(c)}
                  onSave={onSave}
                />
              ))}

              {verseNotes.map((c) => (
                <VerseNote
                  key={c.id}
                  reference={reference}
                  comment={c}
                  isEditing={editingKey === mkKey(c, c.verses)}
                  onEdit={() => onEdit(c)}
                  onSave={onSave}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

type EditorProps = {
  notes?: Output
  reference: Reference
  verses: number[]
  onSaved: () => void
}

const Editor_ = ({notes: persistedNotes, reference, verses, onSaved}: EditorProps) => {
  const [note, setNote] = useState<Output>()
  const [_ready, setReady] = useState(false)
  const editorRef = useRef<BlockNoteEditor>(null)

  const [token, _] = useAtom(TokenAtom)

  // TODO: throttle or debounce this
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
      verses,
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
      onChange={(v) => setNote(v)}
      initialData={persistedNotes}
      readOnly={false}
      onReady={(editor) => {
        setReady(true)
        editorRef.current = editor
      }}
      onBlur={onSaved}
    />
  )
}

type ChapterNoteProps = {
  reference: Reference
  comment: Comment
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
}

const ChapterNote = ({reference, comment, isEditing, onEdit, onSave}: ChapterNoteProps) => {
  const date = new Date(
    comment.created_at === comment.updated_at ? comment.created_at : comment.updated_at
  )

  return (
    <div>
      {isEditing ? (
        <Editor_ notes={comment.comment.json} reference={reference} verses={[]} onSaved={onSave} />
      ) : (
        <div
          className="cursor-pointer text-gray-800 dark:text-gray-100"
          onClick={onEdit}
          dangerouslySetInnerHTML={{__html: comment.comment.html}}
        />
      )}

      <time
        dateTime={comment.created_at}
        title={comment.created_at}
        className="text-xs leading-none text-gray-500"
      >
        {format(date, "yyyy-MM-dd HH:mm")}
      </time>
    </div>
  )
}

type VerseNoteProps = {
  reference: Reference
  comment: Comment
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
}

const VerseNote = ({reference, comment, isEditing, onEdit, onSave}: VerseNoteProps) => {
  const date = new Date(
    comment.created_at === comment.updated_at ? comment.created_at : comment.updated_at
  )

  return (
    <div>
      {isEditing ? (
        <Editor_
          notes={comment.comment.json}
          reference={reference}
          verses={comment.verses}
          onSaved={onSave}
        />
      ) : (
        <div
          className="cursor-pointer text-gray-800 dark:text-gray-100"
          onClick={onEdit}
          dangerouslySetInnerHTML={{__html: comment.comment.html}}
        />
      )}

      <div className="flex items-end gap-2">
        <h2 className="text-sm font-bold leading-none text-gray-600 dark:text-gray-100">
          Verses {formatVerses(comment.verses)}
        </h2>

        <time
          dateTime={comment.created_at}
          title={comment.created_at}
          className="text-xs leading-none text-gray-600 dark:text-gray-100"
        >
          {format(date, "yyyy-MM-dd HH:mm")}
        </time>
      </div>
    </div>
  )
}
