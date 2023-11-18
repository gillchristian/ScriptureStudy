import dynamic from "next/dynamic"

export const Editor = dynamic(() => import("@/components/Editor_"), {
  ssr: false,
  loading: () => <div className="animate-pulse text-gray-500">...</div>
})
