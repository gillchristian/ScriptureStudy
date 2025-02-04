"use server"
import {cookies} from "next/headers"
import formatRelative from "date-fns/formatRelative"

import {Link} from "@/components/Link"
import {listComments} from "@/models/comments"
import {formatVerses} from "@/models/reference"
import {getIndex} from "@/lib/bibleIndex"

export default async function Notes() {
  const now = Date.now()
  const token = (await cookies()).get("token")?.value

  if (!token?.trim()) {
    return (
      <div className="flex h-screen w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
        <div className="text-gray-500">Please log in to view notes</div>
      </div>
    )
  }

  const {books} = await getIndex("NET")
  const notes = await listComments(token, books)

  if (!notes?.length) {
    return (
      <div className="flex h-screen w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
        <div className="text-gray-500">Found no notes</div>
      </div>
    )
  }

  return (
    <div className="flex w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
      <div className="container space-y-8">
        <div className="flex justify-between border-b-2 border-gray-200">
          <p className="font-bold text-gray-600 dark:text-gray-400">Notes</p>
        </div>
        <div className="space-y-4">
          {notes.map(({id, version, book, chapter, verses, created_at}) => {
            const iso = new Date().toISOString()
            const time = new Date(created_at)
            return (
              <div className="grid grid-cols-3" key={id}>
                <div className="my-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {version} {books.names[book]} {chapter}
                    {verses.length > 0 ? ":" : ""}
                    {verses.length > 0 ? formatVerses(verses) : ""}
                  </span>
                </div>
                <div className="my-2 flex items-center justify-center space-x-2">
                  <Link
                    className="text-blue-600 dark:text-blue-400"
                    href={`/notes/${version}/${book}/${chapter}`}
                  >
                    View
                  </Link>
                  <span className="text-gray-600 dark:text-gray-400"> / </span>
                  <Link
                    className="text-blue-600 dark:text-blue-400"
                    href={`/${version}/${book}/${chapter}`}
                  >
                    Edit
                  </Link>
                </div>
                <time dateTime={iso} title={iso} className="my-2 text-right dark:text-gray-500">
                  {formatRelative(time, now)}
                </time>
              </div>
            )
          })}

          {notes.length === 0 && (
            <p className="my-2 text-gray-400 dark:text-gray-600">Nothing to see here ...</p>
          )}
        </div>
      </div>
    </div>
  )
}
