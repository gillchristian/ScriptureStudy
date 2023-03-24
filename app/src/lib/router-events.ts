import {useEffect} from "react"
import {usePathname, useRouter as useRouter_, useSearchParams} from "next/navigation"
import NProgress from "nprogress"

NProgress.configure({showSpinner: false})

export function onStart() {
  NProgress.start()
}

export function onComplete() {
  NProgress.done()
}

export function useOnComplete() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    onComplete()
  }, [pathname, searchParams])
}

export const useRouter = () => {
  const router = useRouter_()

  const push = (url: string) => {
    onStart()
    router.push(url)
  }

  return {...router, push}
}
