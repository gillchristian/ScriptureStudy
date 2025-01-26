"use client"

import {useCallback} from "react"
import {useAtom} from "jotai"
import useSWR from "swr"

import {Link} from "@/components/Link"
import {listComments, SimpleComment} from "@/models/comments"
import {formatVerses} from "@/models/reference"
import {TokenAtom} from "@/models/token"
import formatRelative from "date-fns/formatRelative"
import {getIndex, Index} from "@/lib/bibleIndex"

const now = Date.now()

const mkFetcher = (token: string) => async (_key: string) => {
  if (!token?.trim()) {
    throw new Error("No token")
  }

  const index = await getIndex("NET")
  const comments = await listComments(token, index.books)

  return [comments, index] as [SimpleComment[], Index]
}

export default function Notes() {
  const [token, _] = useAtom(TokenAtom)

  const fetcher = useCallback(mkFetcher(token), [token])

  const {data, error, isLoading} = useSWR<[SimpleComment[], Index]>("all-notes-and-index", fetcher)

  if (isLoading || error?.message === "No token") {
    return (
      <div className="flex h-screen w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
        <div className="animate-pulse text-gray-500">...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
        <div className="text-gray-500">Found no notes</div>
      </div>
    )
  }

  const [notes, {books}] = data

  return (
    <div className="flex w-screen justify-center px-4 pb-10 pt-4 sm:pt-10">
      <div className="container space-y-8">
        <div className="mr-12 flex justify-between border-b-2 border-gray-200">
          <p className="font-bold text-gray-600 dark:text-gray-400">Notes</p>
        </div>
        <div className="space-y-4">
          {notes.map(({version, book, chapter, verses, created_at}) => {
            const iso = new Date().toISOString()
            const time = new Date(created_at)
            return (
              <div className="grid grid-cols-2" key={`/${version}/${book}/${chapter}`}>
                <Link
                  className="my-2 flex items-center space-x-2 text-blue-600 dark:text-blue-400"
                  href={`/${version}/${book}/${chapter}`}
                >
                  <span>
                    {version} {books.names[book]} {chapter}
                    {verses.length > 0 ? ":" : ""}
                    {verses.length > 0 ? formatVerses(verses) : ""}
                  </span>
                </Link>
                <time dateTime={iso} title={iso} className="my-2 dark:text-gray-500">
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
