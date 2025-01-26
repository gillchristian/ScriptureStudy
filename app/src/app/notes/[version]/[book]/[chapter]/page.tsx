"use server"

import * as A from "fp-ts/Array"
import {cookies} from "next/headers"

import {Notes} from "@/components/ChapterNotes_"
import {Link} from "@/components/Link"
import {getIndex, Index} from "@/lib/bibleIndex"
import {Reference} from "@/models/reference"
import {Comment, getChapterComments, getCommentOrd} from "@/models/comments"

type Params = {
  version: string
  book: string
  chapter: string
}

type Props = {params: Promise<Params>}

export default async function ChapterNotes({params}: Props) {
  const params_ = await params

  const chapter_ = parseInt(params_.chapter, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_
  const reference = {version: params_.version, book: params_.book, chapter}

  const cookiesStore = await cookies()

  const token = cookiesStore.get("token")?.value

  if (!token) {
    return (
      <div className="flex w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
        <div className="text-gray-500">No token</div>
      </div>
    )
  }

  const {index, verseNotes, chapterNotes} = await getData(token, reference)

  const title = `${reference.version} | ${index.books.names[reference.book]} ${reference.chapter}`

  return (
    <div className="flex w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
      <div className="container space-y-4">
        <div className="mr-12 flex justify-between border-b-2 border-gray-600 dark:border-gray-400">
          <Link
            className="my-2 flex items-center space-x-2 text-blue-600 dark:text-blue-400"
            href={`/${reference.version}/${reference.book}/${reference.chapter}`}
          >
            <h1 className="text-lg font-bold text-gray-600 dark:text-gray-400">{title}</h1>
          </Link>
        </div>

        <Notes reference={reference} chapterNotes={chapterNotes} verseNotes={verseNotes} />
      </div>
    </div>
  )
}

type Data = {
  index: Index
  chapterNotes: Comment[]
  verseNotes: Comment[]
}

const getData = async (token: string, reference: Reference): Promise<Data> => {
  if (!token?.trim()) {
    throw new Error("No token")
  }

  const index = await getIndex(reference.version)

  const {comments} = await getChapterComments(token, reference)

  const comments_ = A.sort(getCommentOrd(index.books))(comments)

  const chapterNotes = A.takeLeftWhile((c: Comment) => c.verses.length === 0)(comments_)
  const verseNotes = A.dropLeftWhile((c: Comment) => c.verses.length === 0)(comments_)

  return {index, chapterNotes, verseNotes}
}
