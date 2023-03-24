"use client"

import {useState} from "react"
import {useAtom} from "jotai"
import {formatRelative} from "date-fns"

import {VisitedRecentlyAtom} from "@/models/atoms"
import {Link} from "@/components/Link"

export default function History() {
  const [recent, setRecent] = useAtom(VisitedRecentlyAtom)
  const [now, _setNow] = useState(() => Date.now())

  return (
    <div className="flex h-screen w-screen justify-center p-4 pt-4 sm:pt-10">
      <div className="container space-y-8">
        <div className="mr-12 flex justify-between border-b-2 border-gray-200">
          <p className="font-bold text-gray-600 dark:text-gray-400">History</p>

          <button
            className="font-bold text-blue-600 dark:text-blue-400"
            onClick={() => setRecent([])}
          >
            Clear
          </button>
        </div>
        <div className="space-y-4">
          {recent.map(({reference: {version, book, chapter, name}, time}) => {
            const iso = new Date().toISOString()
            return (
              <div className="grid grid-cols-2" key={`/${version}/${book}/${chapter}`}>
                <Link
                  className="my-2 text-blue-600 dark:text-blue-400"
                  href={`/${version}/${book}/${chapter}`}
                >
                  {version} {name}
                </Link>
                <time dateTime={iso} title={iso} className="my-2 dark:text-gray-500">
                  {formatRelative(time, now)}
                </time>
              </div>
            )
          })}

          {recent.length === 0 && (
            <p className="my-2 text-gray-400 dark:text-gray-600">Nothing to see here ...</p>
          )}
        </div>
      </div>
    </div>
  )
}
