import { useSyncExternalStore } from "react"
import { MOBILE_EDITOR_QUERY } from "./personalizer3dConfig"

function subscribe(callback: () => void) {
  const query = window.matchMedia(MOBILE_EDITOR_QUERY)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

export function useMobileEditor() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_EDITOR_QUERY).matches, () => false)
}
