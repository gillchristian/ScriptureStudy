import {Verse} from "./reference"

export type Node_ =
  | {type: "Element"; data: Element_}
  | {type: "Text"; data: string}
  | {type: "Comment"; data: string}

export type Element_ = {
  id?: string
  name: string
  variant: "void" | "normal"
  attributes?: {[key: string]: string | undefined}
  classes?: string[]
  children?: Node_[]
  verse?: Verse
}

export type Node =
  | {type: "Element"; data: Element}
  | {type: "Text"; data: string}
  | {type: "Comment"; data: string}

export type Element = {
  id?: string
  name: string
  variant: "void" | "normal"
  attributes: Attrs
  classes?: string[]
  children?: Node[]
  verse?: Verse
}

export type Attrs = {[key: string]: string | {[key: string]: string} | boolean}

export const processStyle = (styleStr: string): {[rule: string]: string} => {
  try {
    return JSON.parse(styleStr)
  } catch (e) {
    return {}
  }
}

export const htmlToReact = (node: Node_): Node =>
  node.type === "Text"
    ? {type: "Text", data: node.data}
    : node.type === "Comment"
    ? {type: "Comment", data: node.data}
    : {type: "Element", data: element(node.data)}

const element = (node: Element_): Element => ({
  id: node.id,
  name: node.name,
  variant: node.variant,
  attributes: processAttributes(node),
  classes: node.classes,
  children: node.children?.map(htmlToReact),
  verse: node.verse
})

const processAttributes = (node: Element_): Attrs =>
  Object.entries(node.attributes ?? {}).reduce((acc, [key, value]) => {
    const value_ = value === undefined ? true : key === "style" ? processStyle(value) : value
    const key_ = key === "xml:lang" ? "xmlLang" : key

    acc[key_] = value_

    return acc
  }, {} as Attrs)
