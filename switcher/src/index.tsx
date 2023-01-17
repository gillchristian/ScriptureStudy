import React from "react"
import ReactDOM from "react-dom/client"

import "./index.css"
import {Switcher} from "./Switcher"
import {App} from "./App"

const switcher = document.getElementById("switcher") as HTMLElement

if (switcher) {
  ReactDOM.createRoot(switcher).render(
    <React.StrictMode>
      <Switcher />
    </React.StrictMode>
  )
}

const app = document.getElementById("app") as HTMLElement

if (app) {
  ReactDOM.createRoot(app).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
