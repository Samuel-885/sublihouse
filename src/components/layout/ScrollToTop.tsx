import { useEffect, useLayoutEffect } from "react"
import { useLocation } from "react-router"

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation()

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = "manual"
    return () => { window.history.scrollRestoration = previous }
  }, [])

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    // Reapply after a drawer has released its fixed-body scroll lock.
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  // Explicit section links retain their destination, including browser Back.
  useEffect(() => {
    if (!hash) return
    let targetId: string
    try { targetId = decodeURIComponent(hash.slice(1)) } catch { return }
    const frame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "instant", block: "start" })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return null
}
