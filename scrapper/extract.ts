import fs from "fs/promises"

import cheerio from "cheerio"

const SELECTORS = {
  content: ".contents"
}

const extract = (doc: string): string | undefined => {
  const $ = cheerio.load(doc)

  const content = $(SELECTORS.content).html()

  return content ?? undefined
}

const loadChapter = (file: string): Promise<string> =>
  fs.readFile(file, "utf-8")

const [file] = process.argv.slice(2)

if (!file) {
  console.error("Missing file path")
  process.exit(1)
}

loadChapter(file)
  .then(extract)
  .then((html) => console.log(html))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
