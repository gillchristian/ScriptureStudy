import Link from "next/link"

import {CONFIG} from "@/config"

export default function Home() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col">
        <Link className="text-blue-600" href={`/${CONFIG.DEFAULT_VERSION}/genesis/1`}>
          {CONFIG.DEFAULT_VERSION} Genesis 1
        </Link>
      </div>
    </div>
  )
}
