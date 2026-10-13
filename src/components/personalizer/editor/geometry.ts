import { DESIGN_HEIGHT, DESIGN_WIDTH, type DesignPoint, type PersonalizationElement } from "./types"

// CylinderGeometry's UV orientation and CanvasTexture.flipY meet here only.
export function uvToDesign(uv: DesignPoint): DesignPoint {
  return { x: uv.x * DESIGN_WIDTH, y: (1 - uv.y) * DESIGN_HEIGHT }
}

export function rotatedExtents(element: PersonalizationElement) {
  const c = Math.abs(Math.cos(element.rotation)), s = Math.abs(Math.sin(element.rotation))
  return { x: (element.width * c + element.height * s) / 2, y: (element.width * s + element.height * c) / 2 }
}

export function constrainElement<T extends PersonalizationElement>(element: T): T {
  const extent = rotatedExtents(element)
  return { ...element,
    x: Math.max(Math.min(extent.x, DESIGN_WIDTH / 2), Math.min(DESIGN_WIDTH - extent.x, element.x)),
    y: Math.max(Math.min(extent.y, DESIGN_HEIGHT / 2), Math.min(DESIGN_HEIGHT - extent.y, element.y)),
  }
}

export function hitTest(elements: PersonalizationElement[], point: DesignPoint) {
  return [...elements].sort((a, b) => b.zIndex - a.zIndex).find(element => {
    const dx = point.x - element.x, dy = point.y - element.y
    const c = Math.cos(element.rotation), s = Math.sin(element.rotation)
    return Math.abs(dx * c + dy * s) <= element.width / 2 && Math.abs(-dx * s + dy * c) <= element.height / 2
  }) ?? null
}

export function unwrapDelta(currentX: number, previousX: number) {
  let delta = currentX - previousX
  if (delta > DESIGN_WIDTH / 2) delta -= DESIGN_WIDTH
  if (delta < -DESIGN_WIDTH / 2) delta += DESIGN_WIDTH
  return delta
}
