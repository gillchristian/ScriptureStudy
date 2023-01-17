import {FC} from "react"

export type Node = string | Element

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
  typeof node === "string" ? (
    // TODO: this should be done in the JSON processing instead
    node === "end of footnotes" ? (
      <>{undefined}</>
    ) : (
      <span
        dangerouslySetInnerHTML={{
          // TODO: this doesn't fix the problem of the missing spaces because
          //       the Text(String) Node doesn't actually start/end with spaces
          //       is being added by the browser somehow in the HTML version
          __html: node.replace(/^ /, "&nbsp;").replace(/ $/, "&nbsp;")
        }}
      />
    )
  ) : (
    // We don't really care about the types here, we trust that the parser did
    // the right job and we are getting html that can be properly rendered
    // @ts-expect-error
    <node.name
      id={node.id}
      className={node.classes ? node.classes.join(" ") : undefined}
      {...Object.entries(node.attributes ?? {}).reduce((acc, [key, value]) => {
        const value_ =
          value === undefined
            ? true
            : key === "style"
            ? processStyle(value)
            : value

        acc[key] = value_

        return acc
      }, {} as Attrs)}
    >
      {
        // TODO: this is a hack to put spaces between words like "LORD"
        //       because the space between <span>s is not being properly added
        //       by the browser, whereas the HTML version of this does add them
        node.children &&
        node.variant === "normal" &&
        node.classes?.includes("small-caps") ? (
          <span>
            &nbsp;
            {node.children.map((n) => (
              <Html node={n} />
            ))}
            &nbsp;
          </span>
        ) : node.children && node.variant === "normal" ? (
          node.children.map((n) => <Html node={n} />)
        ) : undefined
      }
    </node.name>
  )
