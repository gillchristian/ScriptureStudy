"use client"
import {ReactNode, useState} from "react"

import {Rnd} from "react-rnd"

export const Window = ({children, show}: {children: ReactNode; show: boolean}) => {
  const [width, setWidth] = useState(500)
  const [height, setHeight] = useState(700)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)

  return show ? (
    <Rnd
      bounds=".page"
      size={{width: width, height: height}}
      position={{x, y}}
      onDragStop={(_e, d) => {
        setX(d.x)
        setY(d.y)
      }}
      onResizeStop={(_e, _direction, _ref, delta, {x, y}) => {
        setWidth(width + delta.width)
        setHeight(height + delta.height)
        setX(x)
        setY(y)
      }}
    >
      {children}
    </Rnd>
  ) : null
}
