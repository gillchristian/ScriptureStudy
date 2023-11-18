import {useLayoutEffect, useState} from "react"

type Size = {
  width?: number
  height?: number
}

export function useWindowSize() {
  const [size, setSize] = useState<Size>({})

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    window.screen.orientation.addEventListener("change", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.screen.orientation.removeEventListener("change", handleResize)
    }
  }, [])

  return size
}
