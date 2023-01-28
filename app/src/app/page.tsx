import Link from "next/link"

import {CONFIG} from "@/config"
import {Books, NamedReference, toChapters} from "@/models/reference"

export default async function Home() {
  const version = CONFIG.DEFAULT_VERSION
  const {books, chapters: _} = await getData(version)

  return (
    <div className="flex h-screen w-screen justify-center p-4 pt-4 sm:pt-10">
      <div className="container space-y-8">
        <div>
          <p className="my-2 border-b-2 border-gray-200 font-bold text-gray-600 dark:text-gray-400">
            Old Testament
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {books.inOrder.slice(0, 39).map((book) => (
              <Link className="my-2 text-blue-600" href={`/${version}/${book}/1`} key={book}>
                {books.names[book]}
              </Link>
            ))}
          </div>
        </div>
        <div className="container">
          <p className="my-2 border-b-2 border-gray-200 font-bold text-gray-600 dark:text-gray-400">
            New Testament
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {books.inOrder.slice(39).map((book) => (
              <Link className="my-2 text-blue-600" href={`/${version}/${book}/1`} key={book}>
                {books.names[book]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const getData = async (version: string): Promise<{books: Books; chapters: NamedReference[]}> => {
  const url = `${CONFIG.API_URL}/chapters.json`

  const books: Books = await fetch(url).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error("No chapters"))
  )

  return {books, chapters: toChapters(version, books)}
}
