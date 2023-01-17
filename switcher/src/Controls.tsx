import {CommandLineIcon, HomeIcon} from "@heroicons/react/24/outline"
import {useAtom} from "jotai"
import {CommandPaletteAtom} from "./CommandPalette"

export const Controls = () => {
  const [_open, setOpen] = useAtom(CommandPaletteAtom)

  return (
    <div className="fixed top-3 left-3 space-y-3">
      <a href="/">
        <HomeIcon className="h-6 w-6" />
      </a>

      <button onClick={() => setOpen(true)}>
        <CommandLineIcon className="h-6 w-6" />
      </button>
    </div>
  )
}
