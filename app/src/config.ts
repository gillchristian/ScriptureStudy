export const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  DEFAULT_VERSION: process.env.NEXT_PUBLIC_DEFAULT_VERSION ?? "WEB",
  AVAILABLE_VERSIONS: (process.env.NEXT_PUBLIC_AVAILABLE_VERSIONS ?? "WEB").split(",").sort()
}
