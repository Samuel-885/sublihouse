import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import type { DesignStore } from "../editor/createDesignStore"
import { MOBILE_HANDLES } from "./personalizer3dConfig"
import { projectMobileHandles } from "./mobileSelection"

/** A screen-space drawing only. The viewer retains all pointer handling. */
export default function MobileSelectionHandles({ store }: { store: DesignStore }) {
  const { gl, invalidate } = useThree()
  const overlay = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.className = "pz-mobile-handles"
    canvas.setAttribute("aria-hidden", "true")
    gl.domElement.parentElement!.appendChild(canvas)
    overlay.current = canvas
    const unsubscribe = store.subscribePaint(invalidate)
    invalidate()
    return () => { unsubscribe(); canvas.remove(); overlay.current = null }
  }, [gl, store, invalidate])
  useFrame(({ camera, scene, size }) => {
    const canvas = overlay.current
    if (!canvas) return
    const dpr = gl.getPixelRatio()
    const width = Math.round(size.width * dpr), height = Math.round(size.height * dpr)
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.width, size.height)
    const handles = projectMobileHandles(store.getDesign(), camera, scene, size)
    ctx.strokeStyle = "#ff2859"
    ctx.fillStyle = "#fffdf9"
    ctx.lineWidth = 2
    const rotation = handles.find(handle => handle.kind === "rotate")
    if (rotation) {
      ctx.beginPath(); ctx.moveTo(rotation.top.x, rotation.top.y); ctx.lineTo(rotation.x, rotation.y); ctx.stroke()
    }
    for (const handle of handles) {
      ctx.beginPath()
      if (handle.kind === "rotate") ctx.arc(handle.x, handle.y, MOBILE_HANDLES.rotateSize / 2, 0, Math.PI * 2)
      else {
        const size = MOBILE_HANDLES.resizeSize
        ctx.roundRect(handle.x - size / 2, handle.y - size / 2, size, size, 3)
      }
      ctx.fill(); ctx.stroke()
    }
  })
  return null
}
