import {FC} from "react"

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

export const Html: FC<{node: Node}> = ({node}) =>
  node.type === "Comment" || node.type === "Text" ? (
    node.data === "end of footnotes" ? (
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
  ) : (
    // We don't really care about the types here, we trust that the parser did
    // the right job and we are getting html that can be properly rendered
    // @ts-expect-error
    <node.data.name
      id={node.data.id}
      className={node.data.classes ? node.data.classes.join(" ") : undefined}
      {...Object.entries(node.data.attributes ?? {}).reduce((acc, [key, value]) => {
        const value_ = value === undefined ? true : key === "style" ? processStyle(value) : value

        acc[key] = value_

        return acc
      }, {} as Attrs)}
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
              <Html node={n} key={i} />
            ))}
            &nbsp;
          </span>
        ) : node.data.children && node.data.variant === "normal" ? (
          node.data.children.map((n, i) => <Html node={n} key={i} />)
        ) : undefined
      }
    </node.data.name>
  )
