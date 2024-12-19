"use client"

import {Suspense} from "react"

import {useOnComplete} from "@/lib/router-events"

const OnComplete = () => {
  useOnComplete()

  return <></>
}

export const RootLayoutClient = () => {
  return (
    <Suspense>
      <OnComplete />
    </Suspense>
  )
}
