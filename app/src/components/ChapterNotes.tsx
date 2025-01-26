import {useState, useRef, useEffect} from "react"
import {BlockNoteEditor} from "@blocknote/core"
import {useAtom} from "jotai"
import useSWR from "swr"
import * as A from "fp-ts/Array"

import {Editor} from "@/components/Editor"
import {Output} from "@/models/editor"
import {Books, Reference} from "@/models/reference"
import {TokenAtom} from "@/models/token"
import {AddComment, Comment, addComment, getChapterComments, getCommentOrd} from "@/models/comments"
import {useOnClearSelectedVerses, useOnVerseSelected} from "@/models/selection"

import {EditorAtom} from "./FloatingEditor"
// TODO: rename file
import {Notes} from "./ChapterNotes_"
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

export const ChapterNotes = ({title, reference, books}: Props) => {
  // TODO: this should be some form of global state instead
  const {verses_, clear, toggle} = useSelectedVerses()
  useOnClearSelectedVerses(clear)
  useOnVerseSelected(toggle)

  const [showEditor, _setShowEditor] = useAtom(EditorAtom)

  const [token, _] = useAtom(TokenAtom)

  const {data, isLoading, mutate} = useSWR<Data>(
    `chapter-comment-${reference.version}-${reference.book}-${reference.chapter}`,
    mkFetcher(token, reference, books)
  )

  // TODO: cache this
  const verses = verses_.map((v) => v.verse).sort((a, b) => a - b)

  // The trailing `-` is fine, it's handled in the same way by `@/models/comments`
  const key = `${reference.version}-${reference.book}-${reference.chapter}-${verses.join("-")}`

  // TODO: cache this
  const noteContents = data?.table[key]?.comment?.json

  return (
    // TODO: min-h-screen pushes the editor out of the screen when there are too
    // many notes
    <div className="sticky top-4 flex min-h-screen flex-col space-y-6">
      <div className="prose dark:prose-invert">
        <h2>{title}</h2>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-gray-500">...</div>
      ) : (
        <>
          <div className="flex-1">
            <Notes
              reference={reference}
              chapterNotes={data?.chapterNotes ?? []}
              verseNotes={data?.verseNotes ?? []}
            />
          </div>
          {showEditor && (
            <Editor_
              notes={noteContents}
              reference={reference}
              verses={verses}
              onSaved={mutate}
              // TODO: figure a better way than the `key` hack to force a re-mount
              key={key}
            />
          )}
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
    <div className="h-72">
      <Editor
        onChange={(v) => setNote(v)}
        initialData={persistedNotes}
        readOnly={false}
        onReady={(editor) => {
          setReady(true)
          editorRef.current = editor
        }}
      />
    </div>
  )
}
