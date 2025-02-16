import {CONFIG} from "@/config"
import {getIndex} from "@/lib/bibleIndex"
import {Link} from "@/components/Link"

export default async function Home() {
  const version = CONFIG.DEFAULT_VERSION
  const {books, chapters: _} = await getIndex(version)

  return (
    <div className="page flex h-screen w-screen justify-center pt-4 sm:pt-10">
      <div className="container space-y-6">
        <div className="container">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <Link className="my-2 text-blue-600 dark:text-blue-400" href="/highlights">
              Highlights
            </Link>
            <Link className="my-2 text-blue-600 dark:text-blue-400" href="/notes">
              Notes
            </Link>
            <Link className="my-2 text-blue-600 dark:text-blue-400" href="/history">
              History
            </Link>
          </div>
        </div>
        <div className="container">
          <p className="my-2 border-b-2 border-gray-200 font-bold text-gray-600 dark:text-gray-400">
            Old Testament
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {books.ordered.slice(0, 39).map((book) => (
              <Link
                className="my-2 text-blue-600 dark:text-blue-400"
                href={`/${version}/${book}/1`}
                key={book}
              >
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
            {books.ordered.slice(39).map((book) => (
              <Link
                className="my-2 text-blue-600 dark:text-blue-400"
                href={`/${version}/${book}/1`}
                key={book}
              >
                {books.names[book]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
