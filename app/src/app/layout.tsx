import "./globals.css"

import {Controls} from "@/components/Controls"
import {CommandPalette} from "@/components/CommandPalette"
import {Books, NamedReference, toChapters} from "@/models/reference"
import {CONFIG} from "@/config"

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {books, chapters} = await getData("NET")

  return (
    <html lang="en">
      <head />
      <body className="bg-stone-100 dark:bg-gray-800">
        <Controls />
        <CommandPalette books={books} chapters={chapters} />

        {children}
      </body>
    </html>
  )
}

const getData = async (version: string): Promise<{books: Books; chapters: NamedReference[]}> => {
  const url = `${CONFIG.API_URL}/chapters.json`

  const books: Books = await fetch(url).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error("No chapters"))
  )

  return {books, chapters: toChapters(version, books)}
}
