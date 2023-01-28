import {CONFIG} from "@/config"
import {Books, Reference} from "@/models/reference"

import {Element, Html} from "./Html"

type Props = {books: Books; reference: Reference}

export const Chapter = async ({books, reference}: Props) => {
  const {html} = await getData(reference)

  if (!html) {
    return (
      <div className="mx-auto flex min-h-screen w-full justify-center p-4">
        <div className="prose dark:prose-invert">
          <p>...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full justify-center p-4">
      <div className="prose dark:prose-invert">
        <h2>
          {reference.version}
          {" | "}
          {books.names[reference.book]} {reference.chapter}
        </h2>
        <Html node={html} />
      </div>
    </div>
  )
}

const getData = async ({version, book, chapter}: Reference): Promise<{html?: Element}> => {
  const url = `${CONFIG.API_URL}/${version}/${book}-${chapter}.json`

  const html = await fetch(url)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))))
    .catch(() => undefined)

  return {html}
}
