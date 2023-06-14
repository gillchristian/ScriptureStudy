import {ReactNode, useState, MouseEventHandler, TouchEventHandler, useCallback, useRef} from "react"
import {atom, useAtom} from "jotai"
import {atomWithStorage} from "jotai/utils"
import {
  XMarkIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline"

import {clsxm} from "@/lib/clsxm"

type Props = {children: ReactNode; show: boolean; onClose: () => void}

type MoveEvent = {
  clientX: number
  clientY: number
  width: number
  height: number
}

const XAtom = atomWithStorage("editor_x", 0)
const YAtom = atomWithStorage("editor_y", 0)
const WidthAtom = atomWithStorage("editor_width", 500)
const HeightAtom = atomWithStorage("editor_height", 700)
const FullScreenAtom = atomWithStorage("editor_is_full_screen", false)

// TODO
// - [x] Add a close button
// - [x] Add drag handle button
// - [x] Fix the text (sub/supertext) to not show on top
// - [x] Remember the position and size
// - [ ] Set min/max size (max on mobile)
// - [ ] Fix interaction with the top borders of the window (ie. when the pointer goes outside the window)
// - [ ] Mobile scrolls while dragging (touch-action: none;)
// - [ ] Better icons (triple dots for drag handle, square for min/maximize)
// - [ ] Shortcuts (close, full screen, position somewhere?
// - [ ] Content (ie. Bible chapter) should not be centered otherwise the window covers it
export const Window = ({children, show, onClose}: Props) => {
  const [width, _setWidth] = useAtom(WidthAtom)
  const [height, _setHeight] = useAtom(HeightAtom)
  const [x, setX] = useAtom(XAtom)
  const [y, setY] = useAtom(YAtom)
  const [isFullScreen, setIsFullScreen] = useAtom(FullScreenAtom)
  const [isDragging, setIsDragging] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const shiftX = useRef<number>(0)
  const shiftY = useRef<number>(0)

  const onMouseDown: MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    setIsDragging(true)

    const windowRect = ref.current?.getBoundingClientRect()

    // Calculate the distance from the mouse to the top left corner of the
    // window (ie. the component's outer div)
    shiftX.current = e.clientX - (windowRect?.x ?? 0)
    shiftY.current = e.clientY - (windowRect?.y ?? 0)
  }, [])

  const onTouchStart: TouchEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()

    setIsDragging(true)

    const windowRect = ref.current?.getBoundingClientRect()

    // Calculate the distance from the mouse to the top left corner of the
    // window (ie. the component's outer div)
    shiftX.current = e.changedTouches[0].clientX - (windowRect?.x ?? 0)
    shiftY.current = e.changedTouches[0].clientY - (windowRect?.y ?? 0)
  }, [])

  const toggleFullScreen: MouseEventHandler<HTMLButtonElement> = useCallback((_) => {
    setIsFullScreen((isFullScreen) => !isFullScreen)
  }, [])

  const move = useCallback(({clientX, clientY, width, height}: MoveEvent) => {
    const newX = Math.min(Math.max(clientX - shiftX.current, 0), window.innerWidth - 65 - width)
    const newY = Math.min(Math.max(clientY - shiftY.current, 0), window.innerHeight - height)

    setX(newX)
    setY(newY)
  }, [])

  return show ? (
    <div
      ref={ref}
      className={clsxm("fixed z-50")}
      draggable={isDragging}
      style={{
        width: isFullScreen ? "100%" : width,
        height: isFullScreen ? "100%" : height,
        left: isFullScreen ? 0 : x,
        top: isFullScreen ? 0 : y
      }}
      // Desktop -----------------------
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        // Use an empty div for the image to not show it at all
        // instead we keep updating the element's position
        const img = document.createElement("div")
        e.dataTransfer.setDragImage(img, 0, 0)
      }}
      onDrag={({clientX, clientY}) => {
        move({clientX, clientY, width, height})
      }}
      onDragEnd={({clientX, clientY}) => {
        setIsDragging(false)
        move({clientX, clientY, width, height})
      }}
      // Mobile ------------------------
      onTouchMove={(e) => {
        if (!isDragging) {
          return
        }

        e.stopPropagation()

        const {clientX, clientY} = e.changedTouches[0]

        move({clientX, clientY, width, height})
      }}
      onTouchEnd={(e) => {
        if (!isDragging) {
          return
        }

        e.stopPropagation()

        setIsDragging(false)

        const touch = e.changedTouches[0]

        if (touch) {
          const {clientX, clientY} = touch
          move({clientX, clientY, width, height})
        }
      }}
    >
      {/* Window controls */}
      <div className={clsxm("absolute right-2 flex space-x-3", isFullScreen ? "top-2" : "top-9")}>
        <button onClick={toggleFullScreen} className="rounded bg-gray-200 p-1 dark:bg-gray-400">
          {isFullScreen ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </button>
        <button onClick={onClose} className="rounded bg-gray-200 p-1 dark:bg-gray-400">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex h-full flex-col">
        {/* Drag handle */}
        {!isFullScreen && (
          <div className="flex items-center justify-center pb-1">
            <button
              className="rounded bg-gray-400 bg-opacity-5 px-1"
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
            >
              <EllipsisHorizontalIcon className="h-6 w-6 dark:text-gray-100" />
            </button>
          </div>
        )}{" "}
        {/* Main content */}
        <div className="h-full flex-1">{children}</div>
      </div>
    </div>
  ) : null
}
