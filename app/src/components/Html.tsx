"use client"

import * as S from "fp-ts/Set"
import {Eq as eqString} from "fp-ts/string"
import {useAtom} from "jotai"
import {FC} from "react"

import {clsxm} from "@/lib/clsxm"

import {SelectedVerseAtom} from "./ChaperSideEffects"

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
}

type Attrs = {[key: string]: string | {[key: string]: string} | boolean}

const processStyle = (styleStr: string) =>
  styleStr.split(";").reduce((acc, rule) => {
    const [name, value] = rule.split(":")

    acc[name.trim()] = value.trim()

    return acc
  }, {} as {[key: string]: string})

type Props = {
  node: Node
  current: string
}

export const Html: FC<Props> = ({node, current}) => {
  const [selectedVerses, setSelectedVerses] = useAtom(SelectedVerseAtom)

  if (node.type === "Comment" || node.type === "Text") {
    return node.data === "end of footnotes" ? (
      <>{undefined}</>
    ) : (
      <span
        dangerouslySetInnerHTML={{
          // TODO: this doesn't fix the problem of the missing spaces because
          //       the Text(String) Node doesn't actually start/end with spaces
          //       is being added by the browser somehow in the HTML version
          __html: node.data.replace(/^ /, "&nbsp;").replace(/ $/, "&nbsp;")
        }}
      />
    )
  }

  const verse = node.data.classes?.find((c) => c.startsWith(current))

  const onSelectVerse = () => {
    if (verse) {
      setSelectedVerses((vs) =>
        vs.has(verse) ? S.remove(eqString)(verse)(vs) : S.insert(eqString)(verse)(vs)
      )
    }
  }

  const isSelected = verse ? selectedVerses.has(verse) : false

  return (
    // We don't really care about the types here, we trust that the parser did
    // the right job and we are getting html that can be properly rendered
    //
    // @ts-expect-error
    <node.data.name
      id={node.data.id}
      className={
        node.data.classes
          ? clsxm(node.data.classes, isSelected && "selected", verse && "verse")
          : undefined
      }
      {...Object.entries(node.data.attributes ?? {}).reduce((acc, [key, value]) => {
        const value_ = value === undefined ? true : key === "style" ? processStyle(value) : value

        acc[key] = value_

        return acc
      }, {} as Attrs)}
      onClick={onSelectVerse}
    >
      {
        // TODO: this is a hack to put spaces between words like "LORD"
        //       because the space between <span>s is not being properly added
        //       by the browser, whereas the HTML version of this does add them
        node.data.children &&
        node.data.variant === "normal" &&
        node.data.classes?.includes("small-caps") ? (
          <span>
            &nbsp;
            {node.data.children.map((n, i) => (
              <Html node={n} key={i} current={current} />
            ))}
            &nbsp;
          </span>
        ) : node.data.children && node.data.variant === "normal" ? (
          node.data.children.map((n, i) => <Html node={n} key={i} current={current} />)
        ) : undefined
      }
    </node.data.name>
  )
}
