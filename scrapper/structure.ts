import fs from "fs/promises"

import cheerio from "cheerio"
import fetch from "node-fetch"

const SELECTOR = "a.next-chapter"

type Next = {next: string}

const extract = (doc: string): Next | undefined => {
  const $ = cheerio.load(doc)
  const next = $(SELECTOR).attr("title")

  return next ? {next} : undefined
}

const fetchNext = (
  chapter: string,
  version: string
): Promise<Next | undefined> =>
  fetch(chapterUrl(chapter, version))
    .then((res) =>
      res.ok ? res.text() : Promise.reject(new Error("Failed to fetch"))
    )
    .then(extract)

const chapterUrl = (chapter: string, version: string) =>
  `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
    chapter
  )}&version=${version}`

const formatDuration = (ms: number) => {
  const s = ms / 1000

  if (s < 60) {
    return `${Math.floor(ms / 1000)}s`
  }

  const m = s / 60

  const s_ = Math.floor(s % 60)
  const m_ = Math.floor(m)

  return s_ > 0 ? `${m_}m ${s_}s` : `${m_}m`
}

const withDuration = async (p: () => Promise<void>): Promise<string> => {
  const start = Date.now()

  await p()

  const now = Date.now()

  return formatDuration(now - start)
}

const fetchStructure = ({next}: Next, acc: string[]): Promise<string[]> =>
  fetchNext(next, "NLT").then((next) => {
    if (next) {
      console.log(`Got ${next.next}`)

      return fetchStructure(next, [...acc, next.next])
    }

    console.log(`Done \\o/`)
    return acc
  })

withDuration(() =>
  fetchStructure({next: "Genesis 1"}, ["Genesis 1"]).then((results) =>
    fs.writeFile("structure.json", JSON.stringify(results, null, 2), "utf-8")
  )
).then((time) => {
  console.log(`Took ${time}`)
})
