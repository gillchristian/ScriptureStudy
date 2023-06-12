import {ReactNode, useState, MouseEventHandler, useCallback, useRef} from "react"
import {
  XMarkIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  StopIcon
} from "@heroicons/react/24/outline"

import {clsxm} from "@/lib/clsxm"

type Props = {children: ReactNode; show: boolean; onClose: () => void}

// TODO
// - [x] Add a close button
// - [x] Add drag handle button
// - [x] Fix the text (sub/supertext) to not show on top
// - [ ] Better icons (triple dots for drag handle, square for min/maximize)
// - [ ] Set min/max size (max on mobile)
// - [ ] Fix interaction with the top borders of the window (ie. when the pointer goes outside the window)
export const Window = ({children, show, onClose}: Props) => {
  const [width, _setWidth] = useState(500)
  const [height, _setHeight] = useState(700)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const shiftX = useRef<number>(0)
  const shiftY = useRef<number>(0)

  const startDragging: MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    setIsDragging(true)

    const windowRect = ref.current?.getBoundingClientRect()

    // Calculate the distance from the mouse to the top left corner of the
    // window (ie. the component's outer div)
    shiftX.current = e.clientX - (windowRect?.x ?? 0)
    shiftY.current = e.clientY - (windowRect?.y ?? 0)
  }, [])

  const toggleFullScreen: MouseEventHandler<HTMLButtonElement> = useCallback((_) => {
    setIsFullScreen((isFullScreen) => !isFullScreen)
  }, [])

  const move = useCallback(
    ({
      clientX,
      clientY,
      width,
      height
    }: {
      clientX: number
      clientY: number
      width: number
      height: number
    }) => {
      const newX = Math.min(Math.max(clientX - shiftX.current, 0), window.innerWidth - width)
      const newY = Math.min(Math.max(clientY - shiftY.current, 0), window.innerHeight - height)

      setX(newX)
      setY(newY)
    },
    []
  )

  return show ? (
    <div
      ref={ref}
      className={clsxm("fixed z-50")}
      style={{
        width: isFullScreen ? "100%" : width,
        height: isFullScreen ? "100%" : height,
        left: isFullScreen ? 0 : x,
        top: isFullScreen ? 0 : y
      }}
      onDrag={(e) => {
        move({clientX: e.clientX, clientY: e.clientY, width, height})
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        // Use an empty div for the image to not show it at all
        // instead we keep updating the element's position
        const img = document.createElement("div")
        e.dataTransfer.setDragImage(img, 0, 0)
      }}
      onDragEnd={(e) => {
        setIsDragging(false)

        move({clientX: e.clientX, clientY: e.clientY, width, height})
      }}
      draggable={isDragging}
    >
      <div className="absolute top-2 right-2 flex space-x-3">
        <button onMouseDown={startDragging} className="rounded bg-gray-200 p-1">
          <StopIcon className={"h-4 w-4"} />
        </button>
        <button onClick={toggleFullScreen} className="rounded bg-gray-200 p-1">
          {isFullScreen ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </button>
        <button onClick={onClose} className="rounded bg-gray-200 p-1">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  ) : null
}
