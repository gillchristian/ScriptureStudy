import "./globals.css"

import {Controls} from "@/components/Controls"
import {CommandPalette} from "@/components/CommandPalette"
import {getIndex} from "@/lib/bibleIndex"

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {books, chapters} = await getIndex("NET")

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
