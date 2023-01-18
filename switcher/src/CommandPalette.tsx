import {Fragment, useEffect, useMemo, useState} from "react"
import {Combobox, Dialog, Transition} from "@headlessui/react"
import {MagnifyingGlassIcon} from "@heroicons/react/20/solid"
import {
  NewspaperIcon,
  BookOpenIcon,
  TagIcon,
  ArrowPathRoundedSquareIcon
} from "@heroicons/react/24/outline"
import {atom, useAtom} from "jotai"
import {matchSorter} from "match-sorter"
import {atomWithStorage} from "jotai/utils"

import {options as chapters} from "./options"
import {ChapterAtom, eqChapter, fromPath} from "./Chapter"
import {CONFIG} from "./config"

export type Chapter = {
  tag: "chapter"
  chapter: string
  version: string
}

type ShortcutEnum = "toggle_verses" | "toggle_footnotes"

type Shortcut = {
  tag: "shortcut"
  action: ShortcutEnum
  name: string
  icon: typeof TagIcon
  shortcut: string
}

const ToggleVersesAction: Shortcut = {
  tag: "shortcut",
  action: "toggle_verses",
  name: "Toggle verse numbers ...",
  icon: TagIcon,
  shortcut: "V"
}

const ToggleFootnotesAction: Shortcut = {
  tag: "shortcut",
  action: "toggle_footnotes",
  name: "Toggle footnotes ...",
  icon: NewspaperIcon,
  shortcut: "F"
}

type ActionEnum = "switch_version"

type Action = {
  tag: "action"
  action: ActionEnum
  name: string
  icon: typeof TagIcon
}

const SwitchVersion: Action = {
  tag: "action",
  action: "switch_version",
  name: "Switch version ...",
  icon: ArrowPathRoundedSquareIcon
}

const quickActions: (Shortcut | Action)[] =
  CONFIG.AVAILABLE_VERSIONS.length > 1
    ? [SwitchVersion, ToggleVersesAction, ToggleFootnotesAction]
    : [ToggleVersesAction, ToggleFootnotesAction]

type Version = {
  tag: "version"
  version: string
}

const versions: Version[] = CONFIG.AVAILABLE_VERSIONS.map((version) => ({
  tag: "version",
  version
}))

type Command = Chapter | Shortcut | Action | Version

function classNames(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export const CommandPaletteAtom = atom<boolean>(false)

const VISITED_RECENTLY_KEY = "ScriptureStudy__visited_recently_v2"
const VisitedRecentlyAtom = atomWithStorage<Chapter[]>(VISITED_RECENTLY_KEY, [])

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
  appMode: "app" | "controls_only"
  onToggleVerses: (on: boolean) => void
  onToggleFootnotes: (on: boolean) => void
  onChapterSelect: (version: string, chapter: string) => void
}

type Mode = "commands" | "version_switcher"

export const CommandPalette = ({
  appMode,
  onToggleVerses,
  onToggleFootnotes,
  onChapterSelect
}: Props) => {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useAtom(CommandPaletteAtom)
  const [recent, setRecent] = useAtom(VisitedRecentlyAtom)
  const [config, setConfig] = useAtom(ConfigAtom)
  const [selectedChapter, setSelectedChapter] = useAtom(ChapterAtom)
  const [mode, setMode] = useState<Mode>("commands")

  const filteredChapters = useMemo(
    () =>
      query === "" || mode === "version_switcher"
        ? []
        : matchSorter(chapters, query, {keys: ["chapter"]}).slice(0, 5),
    [query]
  )

  const filteredVersions = useMemo(
    () =>
      query === "" || mode === "commands"
        ? versions
        : matchSorter(versions, query, {keys: ["version"]}).slice(0, 5),
    [query]
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

  const toggleFootnotes = () => {
    setConfig((c) => ({...c, footnotes: !c.footnotes}))
  }

  useEffect(
    () => {
      const handler = (e: KeyboardEvent) => {
        const isCtrl = e.ctrlKey
        const isCmd = e.metaKey
        const isOpenCommandPatellte =
          e.key === "/" || e.key === "k" || e.key === "p"

        if (isOpenCommandPatellte && (isCtrl || isCmd)) {
          e.preventDefault()
          e.stopPropagation()

          setOpen(true)
        }

        const isToggleVerses =
          e.key === ToggleVersesAction.shortcut.toLowerCase()

        if (isToggleVerses && (isCtrl || isCmd)) {
          e.preventDefault()
          e.stopPropagation()

          toggleVerses()
          setOpen(false)
        }

        const isToggleFootnotes =
          e.key === ToggleFootnotesAction.shortcut.toLowerCase()

        if (isToggleFootnotes && (isCtrl || isCmd)) {
          e.preventDefault()
          e.stopPropagation()

          toggleFootnotes()
          setOpen(false)
        }
      }

      document.addEventListener("keydown", handler)

      return () => {
        document.removeEventListener("keydown", handler)
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const insertMostRecent = (chapter: Chapter) =>
    setRecent((recent) => [
      chapter,
      ...recent.filter((c) => !eqChapter.equal(c, chapter)).slice(0, 4)
    ])

  const onOpen = (item: Command) => {
    if (item.tag === "chapter") {
      onChapterSelect(item.version, item.chapter)
      insertMostRecent(item)
    }

    if (item.tag === "action" && item.action === "switch_version") {
      setQuery("")
      setMode("version_switcher")
      return
    }

    if (item.tag === "shortcut" && item.action === "toggle_verses") {
      toggleVerses()
    }

    if (item.tag === "shortcut" && item.action === "toggle_footnotes") {
      toggleFootnotes()
    }

    if (item.tag === "version") {
      const next: Chapter = {
        tag: "chapter",
        ...selectedChapter,
        version: item.version
      }
      setSelectedChapter(next)
      insertMostRecent(next)
      setMode("commands")
    }

    setOpen(false)
  }

  const recent_ =
    appMode === "app"
      ? recent.filter((c) => !eqChapter.equal(c, selectedChapter))
      : recent.filter((c) => !eqChapter.equal(c, fromPath()))

  const onClose = () => {
    setMode("commands")
    setOpen(false)
  }

  return (
    <Transition.Root
      show={open}
      as={Fragment}
      afterLeave={() => setQuery("")}
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
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

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
                          <span className="ml-3 flex-auto truncate">
                            {version.version}
                          </span>
                        </Combobox.Option>
                      ))}
                    </ul>
                  </Combobox.Options>
                )}

                {mode === "commands" &&
                  (query === "" || filteredChapters.length > 0) && (
                    <Combobox.Options
                      static
                      className="max-h-[28rem] scroll-py-2 divide-y divide-gray-500 divide-opacity-20 overflow-y-auto"
                    >
                      {query === "" && (
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                              Actions
                            </h2>
                          )}
                          <ul className="text-sm text-gray-400">
                            {quickActions.map((action) => (
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
                                    <span className="ml-3 flex-auto truncate">
                                      {action.name}
                                    </span>
                                    {action.tag === "shortcut" && (
                                      <span className="ml-3 flex-none text-xs font-semibold text-gray-400">
                                        <kbd className="font-sans">⌘</kbd>
                                        <kbd className="font-sans">
                                          {action.shortcut}
                                        </kbd>
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </ul>
                        </li>
                      )}
                      {query === "" && recent_.length > 0 && (
                        <li className="p-2">
                          <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">
                            Recent reads
                          </h2>

                          <ul className="text-sm text-gray-400">
                            {recent_.map((chapter) => (
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

                {mode === "commands" &&
                  query !== "" &&
                  filteredChapters.length === 0 && (
                    <div className="py-14 px-6 text-center sm:px-14">
                      <BookOpenIcon
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

const Chapter = ({chapter}: {chapter: Chapter}) => (
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
          className={classNames(
            "h-6 w-6 flex-none",
            active ? "text-white" : "text-gray-500"
          )}
          aria-hidden="true"
        />
        <span className="ml-3 flex-auto truncate">
          {chapter.version} | {chapter.chapter}
        </span>
        {active && (
          <span className="ml-3 flex-none text-gray-400">Jump to...</span>
        )}
      </>
    )}
  </Combobox.Option>
)
