"use client"

import {useOnComplete} from "@/lib/router-events"

export const RootLayoutClient = () => {
  useOnComplete()
  return <></>
}
