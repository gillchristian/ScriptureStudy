"use client"

import {useAtom} from "jotai"
import dynamic from "next/dynamic"
import {useCallback, useEffect, useRef, useState} from "react"

import type {TDDocument, TDSnapshot} from "@/Tldraw"
import {Reference} from "@/models/reference"

import {NotesAtom} from "./Controls"
import {useIsMobile} from "@/lib/useIsMobile"

type Props = {reference: Reference}

export const Notes = ({reference}: Props) => {
  const isMobile = useIsMobile()

  return isMobile ? null : <Notes_ reference={reference} />
}

const Tldraw = dynamic(() => import("@/Tldraw").then((m) => m.Tldraw), {ssr: false})

const mkUrl = (reference: Reference) =>
  `/api/_/${reference.version}/${reference.book}/${reference.chapter}`

const Notes_ = ({reference}: Props) => {
  const [fetched, setFetched] = useState(false)
  const [showNotes, _setShowNotes] = useAtom(NotesAtom)
  const [doc, setDoc] = useState<TDDocument | undefined>(undefined)
  const docRef = useRef<TDDocument>()
  const prevRef = useRef<TDDocument>()

  useEffect(() => {
    fetch(mkUrl(reference), {method: "GET"})
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))))
      .then((persisted) => {
        setDoc(persisted)
        prevRef.current = persisted
        docRef.current = persisted
      })
      .catch(() => console.error("Could not fetch"))
      .then(() => setFetched(true))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (docRef.current === prevRef.current) {
        console.log("Has not changed")
        return
      }
      const body = JSON.stringify(docRef.current)
      const prev = docRef.current

      fetch(mkUrl(reference), {method: "POST", headers: {"Content-Type": "application/json"}, body})
        .then((res) => (res.ok ? undefined : Promise.reject(new Error("Failed to fetch"))))
        .then(() => {
          prevRef.current = prev
        })
        .catch(() => console.error("Could not save"))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setDoc(docRef.current)
  }, [showNotes])

  const handleChange = useCallback((state: TDSnapshot) => {
    docRef.current = state.document
  }, [])

  return showNotes && fetched ? (
    <div className="absolute top-0 left-0 z-10 h-full w-full">
      <Tldraw
        showMultiplayerMenu={false}
        showPages={false}
        disableAssets={true}
        document={doc}
        onChange={handleChange}
      />
    </div>
  ) : null
}
