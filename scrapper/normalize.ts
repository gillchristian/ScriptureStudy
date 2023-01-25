import fs from 'fs/promises'

type Chapter_ = [string, number]

const parse = (chapters: string[]) =>
  chapters
    .map(c => {
      const [chapter, ...name] = c.split(' ').reverse()

      return [name.reverse().join(' '), chapter] as [string, string]
    })
    .map(([book, chapter]): Chapter_ => [book, parseInt(chapter, 10)])

const toCount = (chapters: Chapter_[]) =>
  chapters
    .reduce((acc, [book, chapter]) => {
      acc[book] = chapter

      return acc
    }, {} as { [chapter: string]: number })

const toOrder = (chapters: Chapter_[]) =>
  [...new Set(chapters.map(([chapter]) => chapter))]

const normalize = (input: string[]) => {
  const chapters = parse(input)

  return { byCount: toCount(chapters), inOrder: toOrder(chapters) }
}

fs.readFile('structure.json', 'utf-8')
  .then(content => JSON.parse(content))
  .then(normalize)
  .then(s => console.log(JSON.stringify(s, null, 2)))
