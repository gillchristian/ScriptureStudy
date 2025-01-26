"use client"

import format from "date-fns/format"

import {Comment} from "@/models/comments"
import {formatVerses, Reference} from "@/models/reference"

type Props = {
  reference: Reference
  chapterNotes: Comment[]
  verseNotes: Comment[]
}

export function Notes({chapterNotes, verseNotes}: Props) {
  return (
    <div className="space-y-8">
      {chapterNotes.map((comment) => (
        <ChapterNote key={comment.id} comment={comment} />
      ))}

      {verseNotes.map((comment) => (
        <VerseNote key={comment.id} comment={comment} />
      ))}

      {chapterNotes.length === 0 && verseNotes.length === 0 && (
        <p className="my-2 text-gray-400 dark:text-gray-600">Nothing to see here ...</p>
      )}
    </div>
  )
}

const ChapterNote = ({comment}: {comment: Comment}) => {
  const date = new Date(
    comment.created_at === comment.updated_at ? comment.created_at : comment.updated_at
  )

  return (
    <div className="space-y-2">
      <time
        dateTime={comment.created_at}
        title={comment.created_at}
        className="text-sm leading-none text-gray-500"
      >
        {format(date, "yyyy-MM-dd HH:mm")}
        {comment.created_at !== comment.updated_at && " (edited)"}
      </time>
      <div
        className="text-gray-800 dark:text-gray-100"
        dangerouslySetInnerHTML={{__html: comment.comment.html}}
      />
    </div>
  )
}

const VerseNote = ({comment}: {comment: Comment}) => {
  const date = new Date(
    comment.created_at === comment.updated_at ? comment.created_at : comment.updated_at
  )

  return (
    <div className="space-y-2">
      <h2 className="text-lg text-gray-800 dark:text-gray-100">
        Verses {formatVerses(comment.verses)}
      </h2>

      <time
        dateTime={comment.created_at}
        title={comment.created_at}
        className="text-sm leading-none text-gray-500"
      >
        {format(date, "yyyy-MM-dd HH:mm")}
        {comment.created_at !== comment.updated_at && " (edited)"}
      </time>

      <div
        className="text-gray-800 dark:text-gray-100"
        dangerouslySetInnerHTML={{__html: comment.comment.html}}
      />
    </div>
  )
}
