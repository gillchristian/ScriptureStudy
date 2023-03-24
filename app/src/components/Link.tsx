"use client"

import {ComponentProps} from "react"
import NextLink from "next/link"

import {onStart} from "@/lib/router-events"

export const Link = ({href, onClick, ...rest}: ComponentProps<"a">) => {
  const useLink = href && href.startsWith("/")

  if (useLink)
    return (
      <NextLink
        href={href}
        onClick={(event) => {
          const {pathname, search, hash} = window.location
          if (href !== `${pathname}${search}${hash}`) {
            onStart()
          }
          if (onClick) {
            onClick(event)
          }
        }}
        {...rest}
        ref={undefined} // change this if you need, with React.forwardRef
      />
    )

  return <a href={href} onClick={onClick} {...rest} />
}
