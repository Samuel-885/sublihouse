import { DESIGN_HEIGHT, DESIGN_WIDTH, FLAT_SPACE, type PrintableSpace, type DesignPoint, type PersonalizationElement } from "./types"

// CylinderGeometry's UV orientation and CanvasTexture.flipY meet here only.
export function uvToDesign(uv: DesignPoint): DesignPoint {
  return { x: uv.x * DESIGN_WIDTH, y: (1 - uv.y) * DESIGN_HEIGHT }
}

export function rotatedExtents(element: PersonalizationElement) {
  const c = Math.abs(Math.cos(element.rotation)), s = Math.abs(Math.sin(element.rotation))
  return { x: (element.width * c + element.height * s) / 2, y: (element.width * s + element.height * c) / 2 }
}

export function normalizeDesignX(x: number) {
  return ((x % DESIGN_WIDTH) + DESIGN_WIDTH) % DESIGN_WIDTH
}

export function constrainElement<T extends PersonalizationElement>(element: T, space: PrintableSpace = FLAT_SPACE): T {
  const extent = rotatedExtents(element)
  return { ...element,
    x: space.wrapX ? normalizeDesignX(element.x)
      : Math.max(Math.min(extent.x, DESIGN_WIDTH / 2), Math.min(DESIGN_WIDTH - extent.x, element.x)),
    y: Math.max(Math.min(extent.y, DESIGN_HEIGHT / 2), Math.min(DESIGN_HEIGHT - extent.y, element.y)),
  }
}

/** Auxiliary paint centers only; never additional design elements. Padding also
 * includes controls/strokes that cross a seam before the artwork itself does. */
export function wrappedPaintCenters(element: PersonalizationElement, space: PrintableSpace = FLAT_SPACE, padding = 0) {
  if (!space.wrapX) return [element.x]
  const x = normalizeDesignX(element.x), extent = rotatedExtents(element).x + padding
  const centers = [x]
  if (x - extent < 0) centers.push(x + DESIGN_WIDTH)
  if (x + extent > DESIGN_WIDTH) centers.push(x - DESIGN_WIDTH)
  return centers
}

export const MIN_PHOTO_SIZE = 40
export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 140
export type ResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "right" | "bottom" | "left"
export type TransformHandle = ResizeHandle | "rotate"

export function toLocal(element: PersonalizationElement, point: DesignPoint): DesignPoint {
  const dx = point.x - element.x, dy = point.y - element.y
  const c = Math.cos(element.rotation), s = Math.sin(element.rotation)
  return { x: dx * c + dy * s, y: -dx * s + dy * c }
}

export function toDesign(element: PersonalizationElement, point: DesignPoint): DesignPoint {
  const c = Math.cos(element.rotation), s = Math.sin(element.rotation)
  return { x: element.x + point.x * c - point.y * s, y: element.y + point.x * s + point.y * c }
}

// Shared by painting and picking. Keep the rotation control on the printable
// surface even at the top/bottom edge; the panel remains available if occluded.
export function selectionHandles(element: PersonalizationElement, space: PrintableSpace = FLAT_SPACE) {
  const w = element.width / 2, h = element.height / 2
  const handles: { kind: TransformHandle; x: number; y: number }[] = [
    { kind: "top-left", x: -w, y: -h }, { kind: "top-right", x: w, y: -h },
    { kind: "bottom-left", x: -w, y: h }, { kind: "bottom-right", x: w, y: h },
  ]
  if (element.type === "photo") handles.push(
    { kind: "top", x: 0, y: -h }, { kind: "right", x: w, y: 0 },
    { kind: "bottom", x: 0, y: h }, { kind: "left", x: -w, y: 0 },
  )
  const outside = toDesign(element, { x: 0, y: -h - 30 })
  const fits = (space.wrapX || (outside.x >= 10 && outside.x <= DESIGN_WIDTH - 10)) && outside.y >= 10 && outside.y <= DESIGN_HEIGHT - 10
  handles.push({ kind: "rotate", x: 0, y: fits ? -h - 30 : -h + 24 })
  return handles
}

export function hitTestHandle(element: PersonalizationElement, point: DesignPoint, touch = false, space: PrintableSpace = FLAT_SPACE) {
  const radius = touch ? 28 : 15
  const distance = (handle: DesignPoint) => {
    const position = toDesign(element, handle)
    return Math.hypot(space.wrapX ? unwrapDelta(point.x, position.x) : point.x - position.x, point.y - position.y)
  }
  // Rotation first, then the nearest resize handle (large touch targets overlap).
  return selectionHandles(element, space).filter(handle => distance(handle) <= radius)
    .sort((a, b) => a.kind === "rotate" ? -1 : b.kind === "rotate" ? 1
      : distance(a) - distance(b))[0]?.kind ?? null
}

export function handleCursor(handle: TransformHandle) {
  if (handle === "rotate") return "grab"
  if (handle === "left" || handle === "right") return "ew-resize"
  if (handle === "top" || handle === "bottom") return "ns-resize"
  return handle === "top-left" || handle === "bottom-right" ? "nwse-resize" : "nesw-resize"
}

export function resizeFromPointer(element: PersonalizationElement, handle: ResizeHandle, start: DesignPoint, point: DesignPoint) {
  const first = toLocal(element, start), current = toLocal(element, point)
  const sx = handle.includes("left") ? -1 : handle.includes("right") ? 1 : 0
  const sy = handle.includes("top") ? -1 : handle.includes("bottom") ? 1 : 0
  let width = element.width + sx * (current.x - first.x)
  let height = element.height + sy * (current.y - first.y)
  const proportional = element.type === "text" || element.lockAspectRatio || (sx !== 0 && sy !== 0)
  if (proportional) {
    // Projection on the original diagonal avoids abrupt switching of axes.
    const scale = sx && sy
      ? (width * element.width + height * element.height) / (element.width ** 2 + element.height ** 2)
      : sx ? width / element.width : height / element.height
    const minimum = element.type === "text" ? MIN_FONT_SIZE / element.fontSize
      : Math.max(MIN_PHOTO_SIZE / element.width, MIN_PHOTO_SIZE / element.height)
    width = element.width * Math.max(minimum, scale)
    height = element.height * Math.max(minimum, scale)
  } else {
    width = Math.max(MIN_PHOTO_SIZE, width)
    height = Math.max(MIN_PHOTO_SIZE, height)
  }
  return { width, height, sx, sy }
}

export function hitTest(elements: PersonalizationElement[], point: DesignPoint, space: PrintableSpace = FLAT_SPACE) {
  return [...elements].sort((a, b) => b.zIndex - a.zIndex).find(element => {
    const dx = space.wrapX ? unwrapDelta(point.x, element.x) : point.x - element.x, dy = point.y - element.y
    const c = Math.cos(element.rotation), s = Math.sin(element.rotation)
    return Math.abs(dx * c + dy * s) <= element.width / 2 && Math.abs(-dx * s + dy * c) <= element.height / 2
  }) ?? null
}

export function unwrapDelta(currentX: number, previousX: number) {
  return normalizeDesignX(currentX - previousX + DESIGN_WIDTH / 2) - DESIGN_WIDTH / 2
}
