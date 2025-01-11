import {
  ReactNode,
  useState,
  MouseEventHandler,
  TouchEventHandler,
  useCallback,
  useRef,
  useEffect
} from "react"
import {useAtom} from "jotai"
import {atomWithStorage} from "jotai/utils"
import {XMarkIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon} from "@heroicons/react/24/outline"

import {clsxm} from "@/lib/clsxm"

type Props = {children: ReactNode; show: boolean; onClose: () => void}

type MoveEvent = {
  clientX: number
  clientY: number
  width: number
  height: number
}

type Position = "floating" | "fullscreen" | "left-side" | "right-side"

const DEFAULTS = {
  width: 500,
  height: 700,

  minWidth: 300,
  minHeight: 300,

  maxWidth: typeof window !== "undefined" ? window.innerWidth - 65 : 0,
  maxHeight: typeof window !== "undefined" ? window.innerHeight : 0,

  x: 0,
  y: 0,

  position: "normal" as Position,

  sideWidth: 500,
  rightPadding: 65
}

const XAtom = atomWithStorage("editor_x", DEFAULTS.x)
const YAtom = atomWithStorage("editor_y", DEFAULTS.y)
const WidthAtom = atomWithStorage("editor_width", DEFAULTS.width)
const HeightAtom = atomWithStorage("editor_height", DEFAULTS.height)
const PositionAtom = atomWithStorage("editor_position", DEFAULTS.position)

type PositioningStyles = {
  width: number | string
  height: number | string
  left: number
  top: number
}

const limitToWindowHeight = (height: number) => Math.min(height, DEFAULTS.maxHeight)
const limitToWindowWidth = (width: number) => Math.min(width, DEFAULTS.maxWidth)

const windowPositioning = (
  {width, height, x, y}: {width: number; height: number; x: number; y: number},
  position: Position
): PositioningStyles =>
  position === "fullscreen"
    ? {width: "100%", height: "100vh", left: 0, top: 0}
    : position === "left-side"
    ? {width: limitToWindowWidth(DEFAULTS.sideWidth), height: "100vh", left: 0, top: 0}
    : position === "right-side"
    ? {
        width: limitToWindowWidth(DEFAULTS.sideWidth),
        height: "100vh",
        left: Math.max(window.innerWidth - DEFAULTS.sideWidth - DEFAULTS.rightPadding, 0),
        top: 0
      }
    : {width: limitToWindowWidth(width), height: limitToWindowHeight(height), left: x, top: y}

// TODO
// - [ ] Set min/max size (max on mobile)
// - [ ] Mobile scrolls while dragging (touch-action: none;?)
// - [ ] Shortcuts (close, full screen, position presets OS window shortcuts)
// - [ ] Content (ie. Bible chapter) should not be centered otherwise the window covers it
export const Window = ({children, show, onClose}: Props) => {
  const [width, setWidth] = useAtom(WidthAtom)
  const [height, setHeight] = useAtom(HeightAtom)
  const [x, setX] = useAtom(XAtom)
  const [y, setY] = useAtom(YAtom)
  const [position, setPosition] = useAtom(PositionAtom)
  const [isRepositioning, setIsRepositioning] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const shiftX = useRef(0)
  const shiftY = useRef(0)
  // Start in a rought approximation of where the reposition handle is
  // Only keeps track of the position inside the screen
  const lastX = useRef(x + Math.floor(width / 2))
  const lastY = useRef(y + 10)

  const resizeShiftX = useRef(0)
  const resizeShiftY = useRef(0)

  const onDragStart = useCallback(({clientX, clientY, width}: MoveEvent, position: Position) => {
    const isFullScreen = position === "fullscreen"

    // Exit full screen by positkoning the window in the top center of the screen
    if (isFullScreen) {
      setY(0)
      setX(window.innerWidth / 2 - width / 2)
    }

    setIsRepositioning(true)
    setPosition("floating")

    const windowRect = isFullScreen
      ? {x: window.innerWidth / 2 - width / 2, y: 0}
      : ref.current?.getBoundingClientRect() ?? {x: 0, y: 0}

    // Calculate the distance from the mouse to the top left corner of the
    // window (ie. the component's outer div)
    shiftX.current = clientX - windowRect.x
    shiftY.current = clientY - windowRect.y
  }, [])

  const onResizeStart = useCallback(({clientX, clientY, width, height}: MoveEvent) => {
    setIsResizing(true)

    const windowRect = ref.current?.getBoundingClientRect() ?? {x: 0, y: 0}

    // Calculate the distance from the mouse to the bottom right corner of the
    // window (ie. the component's outer div)
    resizeShiftX.current = windowRect.x + width - clientX
    resizeShiftY.current = windowRect.y + height - clientY
  }, [])

  const onStartResizeByMouse: MouseEventHandler<HTMLButtonElement> = useCallback(
    ({clientX, clientY}) => {
      onResizeStart({clientX, clientY, width, height})
    },
    [width, height]
  )

  const onStartResizeByTouch: TouchEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()

      onResizeStart({
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY,
        width,
        height
      })
    },
    [width, height]
  )

  const onStartRepositionByMouse: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      onDragStart({clientX: e.clientX, clientY: e.clientY, width, height}, position)
    },
    [width, height, position]
  )

  const onStartRepositionByTouch: TouchEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()

      onDragStart(
        {clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY, width, height},
        position
      )
    },
    [width, height, position]
  )

  const toggleFullScreen: MouseEventHandler<HTMLButtonElement> = useCallback((_) => {
    setPosition((position) => (position === "fullscreen" ? "floating" : "fullscreen"))
  }, [])

  const move = useCallback(({clientX, clientY, width, height}: MoveEvent, position: Position) => {
    const isOutOfBound = clientX === 0 && clientY === 0

    // Cursor is out of Window bounds and last pointer position was close to the top of the screen
    const isTopBorder = isOutOfBound && lastY.current < 10
    if (isTopBorder) {
      setPosition("fullscreen")
      return
    }

    // Cursor is out of Window bounds and last pointer position was close to the bottom of the screen
    const isBottomBorder = isOutOfBound && lastY.current > window.innerHeight - height - 20
    if (isBottomBorder) {
      return
    }

    // Sometimes we get an unwanted out of bounds event
    if (isOutOfBound) {
      return
    }

    if (clientX > 0 && clientY > 0) {
      lastX.current = clientX
      lastY.current = clientY
    }

    // Pointer is close to the left side of the screen
    const isLeftBorder = clientX < DEFAULTS.sideWidth / 2
    if (isLeftBorder) {
      setPosition("left-side")
      return
    }

    // Pointer is close to the right side of the screen
    const isRightBorder =
      clientX > window.innerWidth - (DEFAULTS.sideWidth + DEFAULTS.rightPadding) / 2
    if (isRightBorder) {
      setPosition("right-side")
      return
    }

    if (position !== "floating") {
      setPosition("floating")
    }

    const deltaX = Math.min(
      Math.max(clientX - shiftX.current, 0),
      window.innerWidth - DEFAULTS.rightPadding - width
    )
    const deltaY = Math.min(Math.max(clientY - shiftY.current, 0), window.innerHeight - height)

    setX(deltaX)
    setY(deltaY)
  }, [])

  const resize = useCallback(
    ({clientX, clientY}: MoveEvent, x: number, y: number, position: Position) => {
      const isOutOfBound = clientX === 0 && clientY === 0

      if (isOutOfBound || position !== "floating") {
        return
      }

      const newWidth = Math.min(
        DEFAULTS.maxWidth,
        Math.max(
          DEFAULTS.minWidth,
          // Don't allow to go further than the right padding
          Math.min(clientX + resizeShiftX.current, window.innerWidth - DEFAULTS.rightPadding) - x
        )
      )
      const newHeight = Math.min(
        DEFAULTS.maxHeight,
        Math.max(
          DEFAULTS.minHeight,
          // Don't allow to go further than the bottom of the screen
          Math.min(clientY + resizeShiftY.current, window.innerHeight) - y
        )
      )

      setWidth(newWidth)
      setHeight(newHeight)
    },
    []
  )

  useEffect(() => {
    const handleResize = () => {
      console.log("TODO: handle resize")
      // Resize behavior:
      // - On mobile (phone) support full-screen
      // - On tablet portrait:  only support full-screen?
      // - On tablet landscape: only support righ/left window split
      // - On larger screens: move or resize the window
      //
      // Tablet ~= iPad 11"
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return show ? (
    <div
      ref={ref}
      className={clsxm("fixed z-50")}
      draggable={isRepositioning || isResizing}
      style={windowPositioning({width, height, x, y}, position)}
      // Desktop -----------------------
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        // Use an empty div for the image to not show it at all
        // instead we keep updating the element's position
        const img = document.createElement("div")
        e.dataTransfer.setDragImage(img, 0, 0)
      }}
      onDrag={({clientX, clientY}) => {
        if (isRepositioning) move({clientX, clientY, width, height}, position)
        if (isResizing) resize({clientX, clientY, width, height}, x, y, position)
      }}
      onDragEnd={({clientX, clientY}) => {
        // clientX/Y are 0 in the last event of `onDrag`
        // so we set one last time on `onDragEnd`
        if (isRepositioning) move({clientX, clientY, width, height}, position)
        if (isResizing) resize({clientX, clientY, width, height}, x, y, position)

        setIsRepositioning(false)
        setIsResizing(false)
      }}
      // Mobile ------------------------
      onTouchMove={(e) => {
        if (!isRepositioning || !isResizing) {
          return
        }

        e.stopPropagation()

        const {clientX, clientY} = e.changedTouches[0]

        if (isRepositioning) move({clientX, clientY, width, height}, position)
        if (isResizing) resize({clientX, clientY, width, height}, x, y, position)
      }}
      onTouchEnd={(e) => {
        if (!isRepositioning || !isResizing) {
          return
        }

        e.stopPropagation()

        setIsRepositioning(false)

        const touch = e.changedTouches[0]

        if (!touch) {
          return
        }

        const {clientX, clientY} = touch

        if (isRepositioning) move({clientX, clientY, width, height}, position)
        if (isResizing) resize({clientX, clientY, width, height}, x, y, position)
      }}
    >
      {/* Reposition handle */}
      <div className="absolute left-1/2 top-1 -translate-x-1/2 transform">
        <button
          className={clsxm("rounded px-1", isRepositioning && "bg-gray-400 bg-opacity-5")}
          onMouseDown={onStartRepositionByMouse}
          onTouchStart={onStartRepositionByTouch}
        >
          <svg
            className="h-6 w-6 dark:text-gray-100"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12C6 13.1046 5.10457 14 4 14C2.89543 14 2 13.1046 2 12Z"
              fill="currentColor"
              fillRule="evenodd"
            />
            <path
              clipRule="evenodd"
              d="M10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z"
              fill="currentColor"
              fillRule="evenodd"
            />
            <path
              clipRule="evenodd"
              d="M18 12C18 10.8954 18.8954 10 20 10C21.1046 10 22 10.8954 22 12C22 13.1046 21.1046 14 20 14C18.8954 14 18 13.1046 18 12Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Resize handle */}
      {position === "floating" && (
        <div className="absolute bottom-0 right-0">
          <button
            className={clsxm(
              "cursor-nwse-resize rounded px-1",
              isResizing && "bg-gray-400 bg-opacity-5"
            )}
            onMouseDown={onStartResizeByMouse}
            onTouchStart={onStartResizeByTouch}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 dark:text-gray-100"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m21 15-6 6m6-13L8 21"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Window controls */}
      <div className={clsxm("absolute right-2 top-2 flex space-x-3")}>
        <button onClick={toggleFullScreen} className="rounded bg-gray-200 p-1 dark:bg-gray-400">
          {position === "fullscreen" ? (
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
        {/* Main content */}
        <div className="h-full flex-1">{children}</div>
      </div>
    </div>
  ) : null
}
