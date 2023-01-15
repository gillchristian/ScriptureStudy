import {Fragment, useEffect, useMemo, useState} from "react"
import {Combobox, Dialog, Transition} from "@headlessui/react"
import {MagnifyingGlassIcon} from "@heroicons/react/20/solid"
import {
  DocumentPlusIcon,
  FolderPlusIcon,
  FolderIcon,
  HashtagIcon,
  TagIcon
} from "@heroicons/react/24/outline"
import {atom, useAtom} from "jotai"
import {matchSorter} from "match-sorter"

import {options as chapters} from "./options"

export type Chapter = {
  tag: "chapter"
  chapter: string
  version: string
}

const recent: Chapter[] = [chapters[0]]

type Action = {
  tag: "action"
  name: string
  icon: typeof DocumentPlusIcon
  shortcut: string
  url: string
}

const quickActions: Action[] = [
  {
    tag: "action",
    name: "Add new file...",
    icon: DocumentPlusIcon,
    shortcut: "N",
    url: "#"
  },
  {
    tag: "action",
    name: "Add new folder...",
    icon: FolderPlusIcon,
    shortcut: "F",
    url: "#"
  },
  {
    tag: "action",
    name: "Add hashtag...",
    icon: HashtagIcon,
    shortcut: "H",
    url: "#"
  },
  {tag: "action", name: "Add label...", icon: TagIcon, shortcut: "L", url: "#"}
]

type Command = Chapter | Action

function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

const CommandPaletteAtom = atom<boolean>(false)

export const CommandPalette = () => {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useAtom(CommandPaletteAtom)

  const filteredChapters = useMemo(
    () =>
      query === ""
        ? []
        : matchSorter(chapters, query, {keys: ["chapter"]}).slice(0, 5),
    [query]
  )

  useEffect(
    () => {
      const handler = (e: KeyboardEvent) => {
        const isCtrl = e.ctrlKey
        const isCmd = e.metaKey
        const isIKey = e.key === "/" || e.key === "k" || e.key === "p"

        if (isIKey && (isCtrl || isCmd)) {
          e.preventDefault()
          e.stopPropagation()

          setOpen(true)
        }
      }

      document.addEventListener("keydown", handler)

      return () => {
        document.removeEventListener("keydown", handler)
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const chaptersToRender = query === "" ? recent : filteredChapters

  return (
    <Transition.Root
      show={open}
      as={Fragment}
      afterLeave={() => setQuery("")}
      appear
    >
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-20 overflow-hidden rounded-xl bg-gray-900 shadow-2xl transition-all">
              <Combobox
                onChange={(item: Command) => {
                  if (item.tag === "chapter") {
                    window.location.assign(
                      `/${item.version}/${item.chapter
                        .replace(/ /g, "-")
                        .toLowerCase()}.html`
                    )
                  }
                  setOpen(false)
                }}
              >
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-white placeholder-gray-500 focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                {(query === "" || filteredChapters.length > 0) && (
                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-20 overflow-y-auto"
                  >
                    {
                      // TODO: add actions like toggle verse numbers
                      false && (
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                              Actions
                            </h2>
                          )}
                          <ul className="text-sm text-gray-400">
                            {quickActions.map((action) => (
                              <Combobox.Option
                                key={action.shortcut}
                                value={action}
                                className={({active}) =>
                                  classNames(
                                    "flex cursor-default select-none items-center rounded-md px-3 py-2",
                                    active && "bg-gray-800 text-white"
                                  )
                                }
                              >
                                {({active}) => (
                                  <>
                                    <action.icon
                                      className={classNames(
                                        "h-6 w-6 flex-none",
                                        active ? "text-white" : "text-gray-500"
                                      )}
                                      aria-hidden="true"
                                    />
                                    <span className="ml-3 flex-auto truncate">
                                      {action.name}
                                    </span>
                                    <span className="ml-3 flex-none text-xs font-semibold text-gray-400">
                                      <kbd className="font-sans">⌘</kbd>
                                      <kbd className="font-sans">
                                        {action.shortcut}
                                      </kbd>
                                    </span>
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </ul>
                        </li>
                      )
                    }
                    <li className="p-2">
                      {query === "" && (
                        <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                          Chapters
                        </h2>
                      )}
                      <ul className="text-sm text-gray-400">
                        {chaptersToRender.map(
                          (chapter) => (
                            console.log(chapter),
                            (
                              <Combobox.Option
                                key={chapter.chapter}
                                value={chapter}
                                className={({active}) =>
                                  classNames(
                                    "flex cursor-default select-none items-center rounded-md px-3 py-2",
                                    active && "bg-gray-800 text-white"
                                  )
                                }
                              >
                                {({active}) => (
                                  <>
                                    <FolderIcon
                                      className={classNames(
                                        "h-6 w-6 flex-none",
                                        active ? "text-white" : "text-gray-500"
                                      )}
                                      aria-hidden="true"
                                    />
                                    <span className="ml-3 flex-auto truncate">
                                      {chapter.chapter}
                                    </span>
                                    {active && (
                                      <span className="ml-3 flex-none text-gray-400">
                                        Jump to...
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            )
                          )
                        )}
                      </ul>
                    </li>
                  </Combobox.Options>
                )}

                {query !== "" && filteredChapters.length === 0 && (
                  <div className="py-14 px-6 text-center sm:px-14">
                    <FolderIcon
                      className="mx-auto h-6 w-6 text-gray-500"
                      aria-hidden="true"
                    />
                    <p className="mt-4 text-sm text-gray-200">
                      We couldn't find any chapters with that term. Please try
                      again.
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
