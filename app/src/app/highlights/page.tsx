"use server"

import {Link} from "@/components/Link"
import {getIndex} from "@/lib/bibleIndex"
import {clsxm} from "@/lib/clsxm"
import {getAllHighlights} from "@/models/highlight"
import {formatVerses} from "@/models/reference"
import formatRelative from "date-fns/formatRelative"

// TODO: extract formatting from `VerseSelection`
// TODO: support sorting by date
// TODO: "paginate" by book ?

export default async function Highlights() {
  const now = Date.now()
  const {books} = await getIndex("NET")
  const highlights = await getAllHighlights(books)

  return (
    <div className="flex h-screen w-screen justify-center p-4 pt-4 sm:pt-10">
      <div className="container space-y-8">
        <div className="mr-12 flex justify-between border-b-2 border-gray-200">
          <p className="font-bold text-gray-600 dark:text-gray-400">Highlights</p>
        </div>
        <div className="space-y-4">
          {highlights.map(({version, book, chapter, verses, color, created_at}) => {
            const iso = new Date().toISOString()
            const time = new Date(created_at)
            return (
              <div className="grid grid-cols-2" key={`/${version}/${book}/${chapter}`}>
                <Link
                  className="my-2 flex items-center space-x-2 text-blue-600 dark:text-blue-400"
                  href={`/${version}/${book}/${chapter}`}
                >
                  <div
                    className={clsxm([
                      "h-4 w-4 rounded-md",
                      color === "green" && "bg-green-200",
                      color === "red" && "bg-red-200",
                      color === "yellow" && "bg-yellow-200"
                    ])}
                  />
                  <span>
                    {version} {books.names[book]} {chapter}:{formatVerses(verses)}
                  </span>
                </Link>
                <time dateTime={iso} title={iso} className="my-2 dark:text-gray-500">
                  {formatRelative(time, now)}
                </time>
              </div>
            )
          })}

          {highlights.length === 0 && (
            <p className="my-2 text-gray-400 dark:text-gray-600">Nothing to see here ...</p>
          )}
        </div>
      </div>
    </div>
  )
}