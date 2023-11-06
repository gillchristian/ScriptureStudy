"use client"

import {CommandLineIcon, HomeIcon, PencilIcon, XMarkIcon} from "@heroicons/react/24/outline"
import {useAtom} from "jotai"
import {identity} from "fp-ts/function"
import {not} from "fp-ts/Predicate"

import {Link} from "@/components/Link"
import {useRoute} from "@/models/routes"

import {CommandPaletteAtom} from "./CommandPalette"
import {EditorAtom} from "./FloatingEditor"

export const Controls = () => {
  const [_open, setOpen] = useAtom(CommandPaletteAtom)
  const [showEditor, setShowEditor] = useAtom(EditorAtom)
  const route = useRoute()

  return (
    <div className="fixed top-2 right-2 z-40 flex flex-col items-center justify-around space-y-1 rounded-md bg-stone-100 p-1 dark:bg-gray-800">
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500"
      >
        <CommandLineIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
      </button>

      {route.tag !== "home" && (
        <Link href="/" className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500">
          <HomeIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
        </Link>
      )}

      {route.tag === "chapter" && (
        <button
          onClick={() => setShowEditor(not(identity))}
          className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-500"
        >
          {showEditor ? (
            <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
          ) : (
            <PencilIcon className="h-6 w-6 text-gray-700 dark:text-stone-100" />
          )}
        </button>
      )}
    </div>
  )
}
