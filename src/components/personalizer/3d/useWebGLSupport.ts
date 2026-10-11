import { useState } from "react"

function supportsWebGL2() {
  if (typeof document === "undefined") return false
  try {
    // Current Three.js requires WebGL 2. Release this probe immediately.
    const context = document.createElement("canvas").getContext("webgl2")
    if (!context) return false
    context.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}

export function useWebGLSupport(enabled: boolean) {
  const [supported] = useState(() => enabled && supportsWebGL2())
  return supported
}
