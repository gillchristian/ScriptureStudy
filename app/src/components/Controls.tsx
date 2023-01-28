"use client"

import {CommandLineIcon, HomeIcon} from "@heroicons/react/24/outline"
import {useAtom} from "jotai"
import Link from "next/link"
import {usePathname} from "next/navigation"

import {CommandPaletteAtom} from "./CommandPalette"

export const Controls = () => {
  const [_open, setOpen] = useAtom(CommandPaletteAtom)
  const pathname = usePathname()

  return (
    <div className="fixed top-2 right-2 flex flex-col items-center justify-around space-y-1 rounded-md bg-stone-100 p-1 dark:bg-gray-800">
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500"
      >
        <CommandLineIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
      </button>

      {pathname !== "/" && (
        <Link href="/" className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500">
          <HomeIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
        </Link>
      )}
    </div>
  )
}
