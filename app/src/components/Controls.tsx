"use client"

import {CommandLineIcon, HomeIcon, PencilSquareIcon} from "@heroicons/react/24/outline"
import {atom, useAtom} from "jotai"
import Link from "next/link"
import {usePathname} from "next/navigation"

import {clsxm} from "@/lib/clsxm"
import {not} from "@/lib/fp"

import {CommandPaletteAtom} from "./CommandPalette"

export const NotesAtom = atom(false)

export const Controls = () => {
  const [_open, setOpen] = useAtom(CommandPaletteAtom)
  const [showNotes, setShowNotes] = useAtom(NotesAtom)
  const pathname = usePathname()

  return (
    <div
      className={clsxm(
        "fixed z-50 flex flex-col items-center justify-around space-y-1 rounded-md bg-stone-100 p-1 dark:bg-gray-800",
        showNotes ? "bottom-2 left-2" : "top-2 right-2"
      )}
    >
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500"
      >
        <CommandLineIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
      </button>

      <button
        onClick={() => setShowNotes(not)}
        className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500"
      >
        <PencilSquareIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
      </button>

      {pathname !== "/" && (
        <Link
          href="/"
          onClick={() => setShowNotes(false)}
          className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500"
        >
          <HomeIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
        </Link>
      )}
    </div>
  )
}
