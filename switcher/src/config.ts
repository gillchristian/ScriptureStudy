export const CONFIG = {
  API_URL: process.env.REACT_APP_API_URL ?? "http://localhost:3000",
  DEFAULT_VERSION: process.env.REACT_APP_DEFAULT_VERSION ?? "WEB",
  AVAILABLE_VERSIONS: (process.env.REACT_APP_AVAILABLE_VERSIONS ?? "WEB")
    .split(",")
    .sort()
}
