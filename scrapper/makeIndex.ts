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

const fetchIndex = ({next}: Next, acc: string[]): Promise<string[]> =>
  fetchNext(next, "NLT").then((next) => {
    if (next) {
      console.log(`Got ${next.next}`)

      return fetchIndex(next, [...acc, next.next])
    }

    console.log(`Done \\o/`)
    return acc
  })

type Chapter_ = [string, string, number]

const parse = (chapters: string[]) =>
  chapters.map((c): Chapter_ => {
    const [chapter, ...name] = c.split(" ").reverse()
    const name_ = name.reverse()
    const humanized = name_.join(" ")
    const hyphenated = name_.join("-").toLowerCase()

    return [humanized, hyphenated, parseInt(chapter!, 10)]
  })

const toCount = (chapters: Chapter_[]) =>
  chapters.reduce((acc, [_, hyphenated, chapter]) => {
    acc[hyphenated] = chapter

    return acc
  }, {} as {[chapter: string]: number})

const toOrder = (chapters: Chapter_[]) => [
  ...new Set(chapters.map(([_, hyphenated]) => hyphenated))
]

const toNameDict = (chapters: Chapter_[]) =>
  chapters.reduce((acc, [humanized, hyphenated, _]) => {
    acc[hyphenated] = humanized

    return acc
  }, {} as {[chapter: string]: string})


type Books = {
  count: {[book: string]: number}
  ordered: string[]
  names: {[book: string]: string}
  shorts: {[book: string]: string}
  by_short: {[book: string]: string}
}

const normalize = (input: string[]): Books => {
  const chapters = parse(input)

  return {
    count: toCount(chapters),
    ordered: toOrder(chapters),
    names: toNameDict(chapters),
    // TODO: implement shorts (ie. abbreviations)
    shorts: toNameDict(chapters),
    by_short: toNameDict(chapters),
  }
}

const argv = process.argv.slice(2)

const normalizeOnly = argv[0] === "--normalize"

const chaptersP = normalizeOnly
  ? fs
      .readFile("chapters.txt", "utf-8")
      .then((contents) => contents.trim().split("\n"))
  : fetchIndex({next: "Genesis 1"}, ["Genesis 1"])

withDuration(() =>
  chaptersP
    .then(normalize)
    .then((index) =>
      fs.writeFile("index.json", JSON.stringify(index, null, 2), "utf-8")
    )
).then((time) => {
  if (!normalizeOnly) {
    console.log(`Took ${time}`)
  }
})
