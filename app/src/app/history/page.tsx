"use client"

import {useAtom} from "jotai"
import Link from "next/link"
import {formatRelative} from "date-fns"

import {VisitedRecentlyAtom} from "@/models/atoms"
import {useState} from "react"

export default function History() {
  const [recent, setRecent] = useAtom(VisitedRecentlyAtom)
  const [now, _setNow] = useState(() => Date.now())

  return (
    <div className="flex h-screen w-screen justify-center p-4 pt-4 sm:pt-10">
      <div className="container space-y-8">
        <div className="flex justify-between border-b-2 border-gray-200">
          <p className="font-bold text-gray-600 dark:text-gray-400">History</p>

          <button className="font-bold text-blue-600" onClick={() => setRecent([])}>
            Clear history
          </button>
        </div>
        <div className="space-y-4">
          {recent.map(({reference: {version, book, chapter, name}, time}) => (
            <div className="grid grid-cols-2" key={`/${version}/${book}/${chapter}`}>
              <Link className="my-2 text-blue-600" href={`/${version}/${book}/${chapter}`}>
                {version} {name}
              </Link>
              <span>{formatRelative(time, now)}</span>
            </div>
          ))}

          {recent.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500">Nothing to see here ...</p>
          )}
        </div>
      </div>
    </div>
  )
}
