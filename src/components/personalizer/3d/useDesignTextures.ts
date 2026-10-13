import { useEffect, useMemo } from "react"
import { useThree } from "@react-three/fiber"
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three"
import { createDesignCanvas, renderDesignToCanvas, renderSelectionToCanvas } from "../editor/compositor"
import type { DesignStore } from "../editor/createDesignStore"

function createTexture() {
  const texture = new CanvasTexture(createDesignCanvas())
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  return texture
}

function createTextures() {
  const art = createTexture(), selection = createTexture()
  return {
    art, selection,
    paint(store: DesignStore) {
      renderDesignToCanvas(art.image, store.getDesign(), store.getPhoto)
      renderSelectionToCanvas(selection.image, store.getDesign())
      art.needsUpdate = selection.needsUpdate = true
    },
    dispose() { art.dispose(); selection.dispose() },
  }
}

export function useDesignTextures(store: DesignStore) {
  const invalidate = useThree(state => state.invalidate)
  const textures = useMemo(() => createTextures(), [])
  useEffect(() => {
    let frame = 0
    let active = true
    const paint = () => {
      frame = 0
      textures.paint(store)
      invalidate()
    }
    const unsubscribe = store.subscribePaint(() => { if (!frame) frame = requestAnimationFrame(paint) })
    paint()
    document.fonts.ready.then(() => { if (active) store.refreshTextMetrics() })
    return () => {
      active = false
      cancelAnimationFrame(frame)
      unsubscribe()
      textures.dispose()
    }
  }, [store, textures, invalidate])
  return textures
}
