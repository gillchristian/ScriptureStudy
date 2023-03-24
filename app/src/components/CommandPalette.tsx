"use client"

import {useSelectedLayoutSegments} from "next/navigation"
import {Fragment, useEffect, useMemo, useRef, useState} from "react"
import {Combobox, Dialog, Transition} from "@headlessui/react"
import {MagnifyingGlassIcon} from "@heroicons/react/20/solid"
import {
  CommandLineIcon,
  NewspaperIcon,
  BookOpenIcon,
  TagIcon,
  ArrowPathRoundedSquareIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArchiveBoxIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline"
import {atom, useAtom} from "jotai"
import {atomWithStorage} from "jotai/utils"
import {matchSorter} from "match-sorter"

import {CONFIG} from "@/config"
import {Books, eqReference, findNext, findPrev, NamedReference, Reference} from "@/models/reference"
import {VisitedRecentlyAtom} from "@/models/atoms"
import {NotesAtom} from "./Controls"
import {not} from "@/lib/fp"
import {useIsMobile} from "@/lib/useIsMobile"
import {useRouter} from "@/lib/router-events"

type Route = {tag: "history"} | {tag: "home"} | {tag: "not_found"} | ({tag: "chapter"} & Reference)
type RouteTag = Route["tag"]

const useRoute = (): Route => {
  const [a, b, c] = useSelectedLayoutSegments()

  if (!a) {
    return {tag: "home"}
  }

  if (a === "history") {
    return {tag: "history"}
  }

  if (!b || !c) {
    return {tag: "not_found"}
  }

  const chapter_ = parseInt(c, 10)
  const chapter = Number.isNaN(chapter_) ? 1 : chapter_

  return {tag: "chapter", version: a, book: b, chapter}
}

type ShortcutEnum =
  | "toggle_notes"
  | "toggle_verses"
  | "toggle_footnotes"
  | "next_chapter"
  | "prev_chapter"
  | "got_to_history"

type Shortcut = {
  tag: "shortcut"
  action: ShortcutEnum
  name: string
  icon: typeof TagIcon
  shortcut: string
  withCtrl: boolean
  showOn: "all" | RouteTag[]
}

const ToggleNotesAction: Shortcut = {
  tag: "shortcut",
  action: "toggle_notes",
  name: "Toggle notes ...",
  icon: PencilSquareIcon,
  shortcut: "d",
  withCtrl: true,
  showOn: ["chapter"]
}

const ToggleVersesAction: Shortcut = {
  tag: "shortcut",
  action: "toggle_verses",
  name: "Toggle verse numbers ...",
  icon: TagIcon,
  shortcut: "v",
  withCtrl: true,
  showOn: ["chapter"]
}

const ToggleFootnotesAction: Shortcut = {
  tag: "shortcut",
  action: "toggle_footnotes",
  name: "Toggle footnotes ...",
  icon: NewspaperIcon,
  shortcut: "f",
  withCtrl: true,
  showOn: ["chapter"]
}

const PrevChapterAction: Shortcut = {
  tag: "shortcut",
  action: "prev_chapter",
  name: "Previous chapter",
  icon: ArrowLeftIcon,
  shortcut: "h",
  withCtrl: false,
  showOn: ["chapter"]
}

const NextChapterAction: Shortcut = {
  tag: "shortcut",
  action: "next_chapter",
  name: "Next chapter",
  icon: ArrowRightIcon,
  shortcut: "l",
  withCtrl: false,
  showOn: ["chapter"]
}

const GoToHistoryAction: Shortcut = {
  tag: "shortcut",
  action: "got_to_history",
  name: "Go to history",
  icon: ArchiveBoxIcon,
  shortcut: "h",
  withCtrl: true,
  showOn: ["chapter", "home", "not_found"]
}

type ActionEnum = "switch_version" | "search_commands"

type Action = {
  tag: "action"
  action: ActionEnum
  name: string
  icon: typeof TagIcon
  showOn: "all" | RouteTag[]
}

const SearchCommands: Action = {
  tag: "action",
  action: "search_commands",
  name: "Search commands",
  icon: CommandLineIcon,
  showOn: "all"
}

const SwitchVersion: Action = {
  tag: "action",
  action: "switch_version",
  name: "Switch version ...",
  icon: ArrowPathRoundedSquareIcon,
  showOn: ["chapter"]
}

const quickActions: (Shortcut | Action)[] =
  CONFIG.AVAILABLE_VERSIONS.length > 1
    ? [
        SwitchVersion,
        GoToHistoryAction,
        ToggleNotesAction,
        ToggleVersesAction,
        ToggleFootnotesAction,
        PrevChapterAction,
        NextChapterAction
      ]
    : [
        GoToHistoryAction,
        ToggleNotesAction,
        ToggleVersesAction,
        ToggleFootnotesAction,
        PrevChapterAction,
        NextChapterAction
      ]

type Version = {
  tag: "version"
  version: string
}

const versions: Version[] = CONFIG.AVAILABLE_VERSIONS.map((version) => ({
  tag: "version",
  version
}))

type Command = NamedReference | Shortcut | Action | Version

function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export const CommandPaletteAtom = atom<boolean>(false)

type Config = {
  verses?: boolean
  footnotes?: boolean
}

const CONFIG_KEY = "ScriptureStudy__config"
const ConfigAtom = atomWithStorage<Config>(CONFIG_KEY, {
  verses: true,
  footnotes: true
})

type Props = {
  books: Books
  chapters: NamedReference[]
}

type Mode = "search" | "commands" | "version_switcher"

export const CommandPalette = ({books, chapters}: Props) => {
  const route = useRoute()

  const selectedChapter: Reference | undefined = route.tag === "chapter" ? route : undefined

  const [query_, setQuery] = useState("")
  const [open, setOpen] = useAtom(CommandPaletteAtom)
  const [showNotes, setShowNotes] = useAtom(NotesAtom)
  const [recent, _setRecent] = useAtom(VisitedRecentlyAtom)
  const [config, setConfig] = useAtom(ConfigAtom)
  const [mode, setMode] = useState<Mode>("search")
  const openRef = useRef(open)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()

  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    if (query_.startsWith(">") && mode !== "commands") {
      setMode("commands")
    }

    if (!query_.startsWith(">") && mode === "commands") {
      setMode("search")
    }
  }, [query_])

  const query = query_.startsWith(">") ? query_.replace(/^>\s?/, "") : query_

  const filteredChapters = useMemo(
    () =>
      mode === "search" && query !== ""
        ? matchSorter(chapters, query, {keys: ["name"]}).slice(0, 5)
        : [],
    [query, mode]
  )

  const filteredVersions = useMemo(
    () =>
      mode === "version_switcher"
        ? matchSorter(versions, query, {keys: ["version"]}).slice(0, 5)
        : versions,
    [query, mode]
  )

  const filteredCommands = useMemo(
    () =>
      (mode === "commands" && query !== ""
        ? matchSorter(quickActions, query, {keys: ["name"]}).slice(0, 5)
        : quickActions
      ).filter((a) => (a.showOn === "all" ? true : a.showOn.includes(route.tag))),

    [query, mode, selectedChapter?.version, selectedChapter?.book, selectedChapter?.chapter]
  )

  useEffect(() => {
    onToggleVerses(config.verses === false ? false : true)
  }, [config.verses])

  useEffect(() => {
    onToggleFootnotes(config.footnotes === false ? false : true)
  }, [config.footnotes])

  const toggleVerses = () => {
    setConfig((c) => ({...c, verses: !c.verses}))
  }

  const router = useRouter()

  const onChapterSelect = ({version, book, chapter}: Reference) => {
    router.push(`/${version}/${book}/${chapter}`)
  }

  const goToHistory = () => {
    router.push(`/history`)
  }

  const toggleFootnotes = () => {
    setConfig((c) => ({...c, footnotes: !c.footnotes}))
  }

  const onNextChapter = () => {
    if (!selectedChapter) {
      return
    }
    const next = findNext(selectedChapter, books)

    if (next) {
      onChapterSelect(next)
    }
  }
  const onPrevChapter = () => {
    if (!selectedChapter) {
      return
    }
    const prev = findPrev(selectedChapter, books)

    if (prev) {
      onChapterSelect(prev)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey
      const isCmd = e.metaKey

      const isModifier = isCmd || isCtrl

      const isOpenCommandPatellte = e.key === "/" || e.key === "k" || e.key === "p"
      if (!open && isOpenCommandPatellte && isModifier) {
        e.preventDefault()
        e.stopPropagation()

        setOpen(true)
        return
      }

      // Shortcuts only work when closed
      if (open) {
        return
      }

      const isToggleNotes = e.key === ToggleNotesAction.shortcut.toLowerCase()
      if (isModifier && isToggleNotes && !isMobile) {
        e.preventDefault()
        e.stopPropagation()

        setShowNotes(not)
        return
      }

      const isToggleVerses = e.key === ToggleVersesAction.shortcut.toLowerCase()
      if (isToggleVerses && isModifier) {
        e.preventDefault()
        e.stopPropagation()

        toggleVerses()
        return
      }

      const isToggleFootnotes = e.key === ToggleFootnotesAction.shortcut.toLowerCase()
      if (isToggleFootnotes && isModifier) {
        e.preventDefault()
        e.stopPropagation()

        toggleFootnotes()
        return
      }

      const isOpenHistory = e.key === GoToHistoryAction.shortcut.toLowerCase()

      if (isModifier && isOpenHistory) {
        e.preventDefault()
        e.stopPropagation()

        goToHistory()
      }

      // Shortcuts with no modifier should not trigger when notes are open
      if (isModifier || showNotes) {
        return
      }

      const isNextChapter = e.key === NextChapterAction.shortcut.toLowerCase()
      if (isNextChapter) {
        e.preventDefault()
        e.stopPropagation()

        onNextChapter()
        return
      }

      const isPrevChapter = e.key === PrevChapterAction.shortcut.toLowerCase()

      if (isPrevChapter) {
        e.preventDefault()
        e.stopPropagation()

        onPrevChapter()
        return
      }
    }

    document.addEventListener("keydown", handler)

    return () => {
      document.removeEventListener("keydown", handler)
    }
  }, [open, showNotes, selectedChapter?.version, selectedChapter?.book, selectedChapter?.chapter])

  const onOpen = (item: Command) => {
    if (item.tag === "chapter") {
      onChapterSelect(item)
    }

    if (item.tag === "action" && item.action === "switch_version") {
      setQuery("")
      setMode("version_switcher")
      return
    }

    if (item.tag === "action" && item.action === "search_commands") {
      setQuery("> ")
      setMode("commands")
      inputRef.current?.focus()
      return
    }

    if (item.tag === "shortcut" && item.action === "toggle_notes" && !isMobile) {
      setShowNotes(not)
    }

    if (item.tag === "shortcut" && item.action === "toggle_verses") {
      toggleVerses()
    }

    if (item.tag === "shortcut" && item.action === "toggle_footnotes") {
      toggleFootnotes()
    }

    if (item.tag === "shortcut" && item.action === "prev_chapter") {
      onPrevChapter()
    }

    if (item.tag === "shortcut" && item.action === "next_chapter") {
      onNextChapter()
    }

    if (item.tag === "version" && selectedChapter) {
      const next: NamedReference = {
        tag: "chapter",
        ...selectedChapter,
        name: books.names[selectedChapter.book],
        version: item.version
      }
      onChapterSelect(next)
      setMode("commands")
    }

    if (item.tag === "shortcut" && item.action === "got_to_history") {
      goToHistory()
    }

    setOpen(false)
  }

  const recent_ = useMemo(
    () =>
      recent
        .filter((c) => (selectedChapter ? !eqReference.equal(c.reference, selectedChapter) : true))
        .slice(0, 5),
    [recent, selectedChapter]
  )

  const onClose = () => {
    setOpen(false)
  }

  return (
    <Transition.Root
      show={open}
      as={Fragment}
      afterLeave={() => {
        setQuery("")
        setMode("search")
      }}
      appear
    >
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Combobox onChange={onOpen}>
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-white placeholder-gray-500 focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    value={query_}
                    ref={inputRef}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                {mode === "commands" && (
                  <Combobox.Options
                    static
                    className="max-h-[28rem] scroll-py-2 divide-y divide-gray-500 divide-opacity-20 overflow-y-auto"
                  >
                    <li className="p-2">
                      <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                        Actions
                      </h2>
                    </li>

                    <ul className="text-sm text-gray-400">
                      {filteredCommands.map((action) =>
                        isMobile && action.action === "toggle_notes" ? null : (
                          <Combobox.Option
                            key={action.action}
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
                                <span className="ml-3 flex-auto truncate">{action.name}</span>
                                {action.tag === "shortcut" && (
                                  <span className="ml-3 flex flex-none justify-end space-x-1 text-xs font-semibold text-gray-400">
                                    {action.withCtrl && (
                                      <kbd className="rounded-sm bg-gray-700 p-1 font-mono leading-none">
                                        Ctrl
                                      </kbd>
                                    )}
                                    <kbd className="w-4 self-end rounded-sm bg-gray-700 p-1 text-center font-mono leading-none">
                                      {action.shortcut}
                                    </kbd>
                                  </span>
                                )}
                              </>
                            )}
                          </Combobox.Option>
                        )
                      )}
                    </ul>
                  </Combobox.Options>
                )}

                {mode === "version_switcher" && (
                  <Combobox.Options
                    static
                    className="max-h-[28rem] scroll-py-2 divide-y divide-gray-500 divide-opacity-20 overflow-y-auto"
                  >
                    <li className="p-2">
                      <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                        Versions
                      </h2>
                    </li>

                    <ul className="text-sm text-gray-400">
                      {filteredVersions.map((version) => (
                        <Combobox.Option
                          key={version.version}
                          value={version}
                          className={({active}) =>
                            classNames(
                              "flex cursor-default select-none items-center rounded-md px-3 py-2",
                              active && "bg-gray-800 text-white"
                            )
                          }
                        >
                          <span className="ml-3 flex-auto truncate">{version.version}</span>
                        </Combobox.Option>
                      ))}
                    </ul>
                  </Combobox.Options>
                )}

                {mode === "search" && (query === "" || filteredChapters.length > 0) && (
                  <Combobox.Options
                    static
                    className="max-h-[28rem] scroll-py-2 divide-y divide-gray-500 divide-opacity-20 overflow-y-auto"
                  >
                    {
                      // Empty query
                      query === "" && (
                        <li className="p-2">
                          <ul className="text-sm text-gray-400">
                            {[SearchCommands].map((action) => (
                              <Combobox.Option
                                key={action.action}
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
                                    <span className="ml-3 flex-auto truncate">{action.name}</span>
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </ul>
                        </li>
                      )
                    }
                    {query === "" && recent_.length > 0 && (
                      <li className="p-2">
                        <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                          Recent reads
                        </h2>

                        <ul className="text-sm text-gray-400">
                          {recent_.map(({reference: chapter}) => (
                            <Chapter
                              key={`recent-${chapter.version}-${chapter.chapter}`}
                              chapter={chapter}
                            />
                          ))}
                        </ul>
                      </li>
                    )}
                    {query !== "" && filteredChapters.length > 0 && (
                      <li className="p-2">
                        <ul className="text-sm text-gray-400">
                          {filteredChapters.map((chapter) => (
                            <Chapter
                              key={`search-${chapter.version}-${chapter.chapter}`}
                              chapter={chapter}
                            />
                          ))}
                        </ul>
                      </li>
                    )}
                  </Combobox.Options>
                )}

                {mode === "search" && query !== "" && filteredChapters.length === 0 && (
                  <div className="py-14 px-6 text-center sm:px-14">
                    <BookOpenIcon className="mx-auto h-6 w-6 text-gray-500" aria-hidden="true" />
                    <p className="mt-4 text-sm text-gray-200">
                      We couldn't find any chapters with that term. Please try again.
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

const Chapter = ({chapter}: {chapter: NamedReference}) => (
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
        <BookOpenIcon
          className={classNames("h-6 w-6 flex-none", active ? "text-white" : "text-gray-500")}
          aria-hidden="true"
        />
        <span className="ml-3 flex-auto truncate">
          {chapter.version} | {chapter.name}
        </span>
        {active && <span className="ml-3 flex-none text-gray-400">Jump to...</span>}
      </>
    )}
  </Combobox.Option>
)

const onToggleFootnotes = (on: boolean) => {
  if (on) {
    document.body.classList.remove("hide-footnotes")
  } else {
    document.body.classList.add("hide-footnotes")
  }
}

const onToggleVerses = (on: boolean) => {
  if (on) {
    document.body.classList.remove("hide-verses")
  } else {
    document.body.classList.add("hide-verses")
  }
}
