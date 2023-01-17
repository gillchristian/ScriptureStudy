import fs from "fs/promises"

import cheerio from "cheerio"
import prettier from "prettier"
import fetch from "node-fetch"

const SELECTORS = {
  next: "a.next-chapter",
  prev: "a.prev-chapter",
  content: ".passage-text"
}

const wrapWithTemplate = ({
  version,
  title,
  content
}: {
  version: string
  title: string
  content: string
}) =>
  `
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script>
      <script defer="defer" src="/main.js"></script>
      <link href="/main.css" rel="stylesheet" />
      <title>${version} | ${title}</title>
    </head>
    <body class="p-4 bg-stone-100">
      <div id="switcher"></div>
      <div class="flex justify-center mx-auto w-full items-center">
        <div class="prose">
          <h2>${title}</h2>
          <div class="contents">
            ${content}
          </div>
        </div>
      </div>
    </body>
  </html>`.trim()

const SHOULD_WRAP_WITH_TEMPLATE = true

const format = (content: string) =>
  prettier.format(content, {parser: "html"}).trim()

const extract = ({
  version,
  title,
  doc
}: {
  version: string
  title: string
  doc: string
}): Chapter | undefined => {
  const $ = cheerio.load(doc)

  const content = $(SELECTORS.content).html()
  const prev = $(SELECTORS.prev).attr("title")
  const next = $(SELECTORS.next).attr("title")

  return content
    ? {
        content: SHOULD_WRAP_WITH_TEMPLATE
          ? format(wrapWithTemplate({version, title, content}))
          : format(content),
        prev,
        next
      }
    : undefined
}

type Chapter = {
  content: string
  prev?: string
  next?: string
}

const loadChapter = (chapter: string, version: string): P =>
  fetch(chapterUrl(chapter, version))
    .then((res) =>
      res.ok ? res.text() : Promise.reject(new Error("Failed to fetch"))
    )
    .then((doc) => extract({version, title: chapter, doc}))

const saveChapter = (html: string, chapter: string, version: string) =>
  fs
    .writeFile(
      `./bibles/${version}/${chapter.replace(/ /g, "-").toLowerCase()}.html`,
      html,
      "utf-8"
    )
    .then(() => true)
    .catch(() => false)

const chapterUrl = (chapter: string, version: string) =>
  `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
    chapter
  )}&version=${version}`

type AsynCache<P> = {
  [key: string]: Promise<P>
}

type Meta = {attempts: number; reason?: string}

type CacheMeta = {
  [key: string]: Meta
}

type Chapter_ = Chapter | undefined

type P = Promise<Chapter_>

type Task = () => Promise<void>

type Queue = {
  queue: Array<Task>
  concurrency: number
  inProgress: number
}

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

const mkBibleDownloader = (version: string) => {
  const cache: AsynCache<boolean> = {}
  const cacheMeta: CacheMeta = {}

  const EMPTY_META: Meta = {attempts: 0, reason: undefined}

  const lookup = (chapter: string): {meta: Meta; p: Promise<boolean>} => {
    const p = cache[chapter] ?? Promise.resolve(false)
    const meta = cacheMeta[chapter] ?? EMPTY_META

    return {p, meta}
  }

  const insertPending = (chapter: string, p: Promise<boolean>) => {
    const {meta} = lookup(chapter)

    cache[chapter] = p
    cacheMeta[chapter] = {attempts: meta.attempts + 1, reason: undefined}
  }

  const insertFailure = (chapter: string, reason: string) => {
    const {meta} = lookup(chapter)

    cache[chapter] = Promise.resolve(false)
    cacheMeta[chapter] = {attempts: meta.attempts, reason}
  }

  const QUEUE: Queue = {queue: [], concurrency: 5, inProgress: 0}

  const push = (tasks: Task | Task[]) => {
    return Array.isArray(tasks)
      ? QUEUE.queue.push(...tasks)
      : QUEUE.queue.push(tasks)
  }

  const runQueue = (): Promise<boolean> => {
    const toRun = QUEUE.concurrency - QUEUE.inProgress

    if (QUEUE.concurrency === QUEUE.inProgress) {
      return Promise.resolve(true)
    }

    const tasksToRun = QUEUE.queue.slice(0, toRun)

    const running = tasksToRun.map((task) =>
      task()
        .catch(() => undefined)
        .then(() => {
          QUEUE.inProgress = QUEUE.inProgress - 1

          return runQueue()
        })
    )

    QUEUE.queue = QUEUE.queue.slice(toRun)

    return Promise.all(running)
      .then((_) => true)
      .catch((_) => false)
  }

  const fetchAndSave = async (chapter: string, version: string) => {
    console.log(`[${version}] ${chapter} - Start`)

    const {meta, p} = lookup(chapter)

    const savedAlready = await p

    const tooManyAttempts = meta.attempts >= 5

    if (tooManyAttempts) {
      insertFailure(chapter, "Too many attempts")
    }

    if (savedAlready || meta.reason || tooManyAttempts) {
      console.log(`[${version}] ${chapter} - Already done`)
      return
    }

    const p_ = loadChapter(chapter, version)
      .then((c) => (c ? c : Promise.reject(new Error("No content"))))
      .then(({content, next}) => {
        if (next) {
          const t = () => fetchAndSave(next, version)

          push(t)
        }

        return saveChapter(content, chapter, version)
      })
      .catch((err) => {
        console.error(err)

        const retry = () => fetchAndSave(chapter, version)

        push(retry)

        return false
      })

    insertPending(chapter, p_)

    return p_.then((success) => {
      if (success) {
        console.log(`[${version}] ${chapter} - Saved`)
      } else {
        console.log(`[${version}] ${chapter} - Failed`)
      }
    })
  }

  push([
    () => fetchAndSave("Genesis 1", version),
    () => fetchAndSave("Joshua 1", version),
    () => fetchAndSave("Psalms 1", version),
    () => fetchAndSave("Isaiah 1", version),
    () => fetchAndSave("Mark 1", version)
  ])

  const run = () =>
    runQueue().then((success) => {
      const result = success ? "SUCCESS" : "FAILED"

      console.log(`[${version}] Done - ${result}`)
    })

  return {run: () => withDuration(run)}
}

const zip = <A, B>(as: A[], bs: B[]): Array<[A, B]> => {
  const as_ = as.slice(0, bs.length)
  const bs_ = bs.slice(0, as.length)

  return as_.map((a, i) => [a, bs_[i]!])
}

const versions = process.argv.slice(2)

console.log(`Downloading ${versions.join(" ")}`)

versions
  .map((version) => mkBibleDownloader(version))
  .reduce(
    (chain, next) =>
      chain.then((acc) => next.run().then((time) => [...acc, time])),
    Promise.resolve([] as string[])
  )
  .then((times) =>
    zip(versions, times).forEach(([version, time]) =>
      console.log(`${version} took ${time}`)
    )
  )
