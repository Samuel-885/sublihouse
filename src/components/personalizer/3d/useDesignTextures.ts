import { useEffect, useMemo } from "react"
import { useThree } from "@react-three/fiber"
import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three"
import { createDesignCanvas, renderDesignToCanvas, renderSelectionToCanvas } from "../editor/compositor"
import type { DesignStore } from "../editor/createDesignStore"
import { useMobileEditor } from "./useMobileEditor"

function createTexture(wrapX: boolean) {
  const texture = new CanvasTexture(createDesignCanvas())
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.wrapS = wrapX ? RepeatWrapping : ClampToEdgeWrapping
  return texture
}

function createTextures(wrapX: boolean) {
  const art = createTexture(wrapX), selection = createTexture(wrapX)
  return {
    art, selection,
    paint(store: DesignStore, drawHandles: boolean) {
      renderDesignToCanvas(art.image, store.getDesign(), store.getPhoto)
      renderSelectionToCanvas(selection.image, store.getDesign(), drawHandles)
      art.needsUpdate = selection.needsUpdate = true
    },
    dispose() { art.dispose(); selection.dispose() },
  }
}

export function useDesignTextures(store: DesignStore) {
  const mobile = useMobileEditor()
  const invalidate = useThree(state => state.invalidate)
  const textures = useMemo(() => createTextures(store.getDesign().space.wrapX), [store])
  useEffect(() => {
    let frame = 0
    let active = true
    const paint = () => {
      frame = 0
      textures.paint(store, !mobile)
      invalidate()
    }
    const unsubscribe = store.subscribePaint(() => { if (!frame) frame = requestAnimationFrame(paint) })
    paint()
    document.fonts.ready.then(() => { if (active) store.refreshTextMetrics() })
    return () => {
      active = false
      cancelAnimationFrame(frame)
      unsubscribe()
    }
  }, [store, textures, invalidate, mobile])
  useEffect(() => () => textures.dispose(), [textures])
  return textures
}
