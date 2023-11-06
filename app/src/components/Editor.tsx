import dynamic from "next/dynamic"

export const Editor = dynamic(() => import("@/components/Editor_"), {
  ssr: false,
  loading: () => <div className="h-8 w-full animate-pulse rounded-lg bg-gray-500" />
})
