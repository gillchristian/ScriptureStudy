"use client"

import {atom, useAtom} from "jotai"
import {useEffect} from "react"

const MobileAtom = atom(false)

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useAtom(MobileAtom)

  useEffect(() => {
    // @reference https://stackoverflow.com/a/42835826/4530566
    const mq = window.matchMedia("(pointer:coarse), (pointer: none)")

    setIsMobile(mq.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mq.addEventListener("change", handler)

    return () => {
      mq.removeEventListener("change", handler)
    }
  }, [])

  return isMobile
}
