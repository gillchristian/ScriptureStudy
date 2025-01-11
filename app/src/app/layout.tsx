import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "nprogress/nprogress.css"

import "./globals.css"

import {Controls} from "@/components/Controls"
import {CommandPalette} from "@/components/CommandPalette"
import {getIndex} from "@/lib/bibleIndex"

import {RootLayoutClient} from "./layout.client"

export const metadata = {
  title: "The Bible",
  description: "My own, personal Bible"
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {books, chapters} = await getIndex("NET")

  return (
    <html lang="en">
      <head />
      <body className="bg-stone-100 p-4 dark:bg-gray-800">
        <RootLayoutClient />
        <Controls />
        <CommandPalette books={books} chapters={chapters} />

        {children}
      </body>
    </html>
  )
}
