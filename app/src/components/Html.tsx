"use client"

import {FC, useMemo} from "react"

import {clsxm} from "@/lib/clsxm"
import {Books, Reference, Verse} from "@/models/reference"

import {useHighlights, useVerseToggler} from "./VerseSelection"
import {useAtom} from "jotai"
import {TokenAtom} from "@/models/token"

export type Node =
  | {type: "Element"; data: Element}
  | {type: "Text"; data: string}
  | {type: "Comment"; data: string}

export type Element = {
  id?: string
  name: string
  variant: "void" | "normal"
  attributes?: {[key: string]: string | undefined}
  classes?: string[]
  children: Node[]
  verse?: Verse
}

type Attrs = {[key: string]: string | {[key: string]: string} | boolean}

const processStyle = (styleStr: string): {[rule: string]: string} => {
  try {
    return JSON.parse(styleStr)
  } catch (e) {
    return {}
  }
}

type Props = {
  node: Node
  version: string
  books: Books
  reference: Reference
  // Section titles have the same data as the following
  // verse although aren't part of the verse.
  isTitleChild?: boolean
}

export const Html: FC<Props> = ({node, version, books, reference, isTitleChild = false}) => {
  if (node.type === "Comment") {
    return null
  }

  if (node.type === "Text") {
    return (
      <>
        <Text text={node.data} />{" "}
      </>
    )
  }

  if (node.data.verse && !isTitleChild) {
    return (
      <Verse_
        // TS doesn't pick up that `node.data.verse` is present
        // @ts-expect-error
        element={node.data}
        version={version}
        books={books}
        reference={reference}
      />
    )
  }

  return (
    // We don't really care about the types here, we trust that the parser did
    // the right job and we are getting html that can be properly rendered
    //
    // @ts-expect-error
    <node.data.name
      id={node.data.id}
      className={node.data.classes ? clsxm(node.data.classes) : undefined}
      {...Object.entries(node.data.attributes ?? {}).reduce((acc, [key, value]) => {
        const value_ = value === undefined ? true : key === "style" ? processStyle(value) : value
        const key_ = key === "xml:lang" ? "xmlLang" : key

        acc[key_] = value_

        return acc
      }, {} as Attrs)}
    >
      {node.data.children?.map((n, i) => (
        <Html
          node={n}
          key={i}
          version={version}
          books={books}
          reference={reference}
          isTitleChild={node.data.name === "h3"}
        />
      ))}
    </node.data.name>
  )
}

const Text = ({text: __html}: {text: string}) => <span dangerouslySetInnerHTML={{__html}} />

type VerseProps = {
  element: Element & {verse: Verse}
  version: string
  books: Books
  reference: Reference
}

const Verse_: FC<VerseProps> = ({element, version, books, reference}) => {
  const [token, _] = useAtom(TokenAtom)
  const {toggle: toggleVerse, isSelected} = useVerseToggler()

  const {verse} = element

  const {table} = useHighlights(reference.version, reference.book, reference.chapter)

  const key = `${reference.version}-${reference.book}-${reference.chapter}-${verse.verse}`
  const green = useMemo(() => table[`${key}-green`], [table, key])
  const red = useMemo(() => table[`${key}-red`], [table, key])
  const yellow = useMemo(() => table[`${key}-yellow`], [table, key])

  const onSelectVerse = () => {
    if (token) {
      toggleVerse(element.verse)
    }
  }

  return (
    // We don't really care about the types here, we trust that the parser did
    // the right job and we are getting html that can be properly rendered
    //
    // @ts-expect-error
    <element.name
      id={element.id}
      className={
        element.classes
          ? clsxm(
              element.classes,
              "verse",
              "cursor-pointer",
              isSelected(verse) && "underline decoration-dotted",
              // highlights
              green && "bg-green-200 dark:bg-green-400 dark:text-gray-800",
              red && "bg-red-200 dark:bg-red-400 dark:text-gray-800",
              yellow && "bg-yellow-200 dark:bg-yellow-400 dark:text-gray-800"
            )
          : undefined
      }
      {...Object.entries(element.attributes ?? {}).reduce((acc, [key, value]) => {
        const value_ = value === undefined ? true : key === "style" ? processStyle(value) : value
        const key_ = key === "xml:lang" ? "xmlLang" : key

        acc[key_] = value_

        return acc
      }, {} as Attrs)}
      onClick={onSelectVerse}
    >
      {element.children?.map((n, i) => (
        <Html node={n} key={i} version={version} books={books} reference={reference} />
      ))}
    </element.name>
  )
}
