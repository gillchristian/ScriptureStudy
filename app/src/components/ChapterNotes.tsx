import {useState, useRef, useEffect, useMemo, useCallback} from "react"
import {BlockNoteEditor} from "@blocknote/core"
import {useAtom} from "jotai"
import useSWR from "swr"
import * as A from "fp-ts/Array"
import format from "date-fns/format"

import {Editor} from "@/components/Editor"
import {Output} from "@/models/editor"
import {Books, Reference, formatVerses} from "@/models/reference"
import {TokenAtom} from "@/models/token"
import {
  AddComment,
  Comment,
  upsertComment,
  getChapterComments,
  getCommentOrd
} from "@/models/comments"
import {
  emitClearSelectedVerses,
  emitVerseSelected,
  useOnClearSelectedVerses,
  useOnVerseSelected
} from "@/models/selection"

import {EditorAtom} from "./FloatingEditor"
import {useSelectedVerses} from "./VerseSelection"
import {p} from "@/lib/language"
import {clsxm} from "@/lib/clsxm"
import {CheckIcon} from "@heroicons/react/20/solid"

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

  const verses = useMemo(() => verses_.map((v) => v.verse).sort((a, b) => a - b), [verses_])

  // The trailing `-` is fine, it's handled in the same way by `@/models/comments`
  const key = useMemo(() => mkKey(reference, verses), [reference, verses])

  const hasNote = Boolean(data?.table[key])

  const chapterNotes = data?.chapterNotes ?? []
  const verseNotes = data?.verseNotes ?? []

  const onEdit = (c: Comment) => {
    clear()
    emitClearSelectedVerses()
    setEditingKey(mkKey(c, c.verses))
    setShowEditor(true)
    c.verses
      .map((v) => ({book: c.book, chapter: c.chapter, verse: v}))
      .forEach((v) => {
        toggle(v)
        emitVerseSelected(v)
      })
  }

  const onNew = () => {
    setEditingKey(key)
    setShowEditor(true)
  }

  const onSave = () => {
    setEditingKey(undefined)
    setShowEditor(false)
    mutate()
    clear()
    emitClearSelectedVerses()
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
              {hasNote ? null : editingKey === key ? (
                <Editor_ reference={reference} verses={verses} onSaved={onSave} />
              ) : !editingKey ? (
                <button
                  className="my-2 text-gray-400 dark:text-gray-600"
                  type="button"
                  onClick={onNew}
                >
                  {verses.length > 0
                    ? `Add ${p(verses.length, "verse")} ${formatVerses(verses)} note ...`
                    : "Add chapter note ..."}
                </button>
              ) : null}

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

type Action = () => Promise<void>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const noOp = () => Promise.resolve()

const Editor_ = ({notes: persistedNotes, reference, verses, onSaved}: EditorProps) => {
  const [note, setNote] = useState<Output>()
  const editorRef = useRef<BlockNoteEditor>(null)
  const actionRef = useRef<Action | null>(null)

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
      verses,
      comment: {
        html,
        text,
        json: note
      },
      public: false
    }

    actionRef.current = () => upsertComment(token, comment).then(noOp)
  }

  useEffect(() => {
    if (note) {
      save()
    }
  }, [note])

  useEffect(() => {
    const loop = async () => {
      const action = actionRef.current ?? noOp
      actionRef.current = null
      await action()
      await wait(200)
      await loop()
    }

    loop()
  }, [])

  return (
    <div className="relative -ml-12">
      <button className="absolute right-20 top-0 z-50" type="button" onClick={onSaved}>
        <CheckIcon className="h-6 w-6 text-gray-500 dark:text-gray-600" />
      </button>
      <Editor
        onChange={setNote}
        initialData={persistedNotes}
        readOnly={false}
        onReady={(editor) => {
          editorRef.current = editor
        }}
      />
    </div>
  )
}

type NoteProps = {
  reference: Reference
  comment: Comment
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
}

const ChapterNote = ({reference, comment, isEditing, onEdit, onSave}: NoteProps) => {
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

const VerseNote = ({reference, comment, isEditing, onEdit, onSave}: NoteProps) => {
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
          {p(comment.verses.length, "Verse")} {formatVerses(comment.verses)}
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
