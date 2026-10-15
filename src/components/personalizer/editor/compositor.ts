import { drawText } from "./textLayout"
import { selectionHandles, wrappedPaintCenters } from "./geometry"
import { DESIGN_HEIGHT, DESIGN_WIDTH, type PersonalizationDesign } from "./types"

export function createDesignCanvas() {
  const canvas = document.createElement("canvas")
  canvas.width = DESIGN_WIDTH
  canvas.height = DESIGN_HEIGHT
  return canvas
}

function contextFor(canvas: HTMLCanvasElement) {
  // WebGL repeatedly reads this canvas for texture uploads. A CPU backing also
  // avoids stale transparent frames when clearing a GPU-backed selection canvas.
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Canvas 2D is unavailable")
  context.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
  return context
}

export function renderDesignToCanvas(canvas: HTMLCanvasElement, design: PersonalizationDesign, getPhoto: (source: string) => HTMLImageElement | undefined) {
  const context = contextFor(canvas)
  context.fillStyle = "#fffdf9"
  context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
  for (const element of [...design.elements].sort((a, b) => a.zIndex - b.zIndex)) {
    for (const centerX of wrappedPaintCenters(element, design.space)) {
      context.save()
      context.translate(centerX, element.y)
      context.rotate(element.rotation)
      if (element.type === "photo") {
        const image = getPhoto(element.source)
        if (image) {
          const { width, height } = element
          context.beginPath()
          context.roundRect(-width / 2, -height / 2, width, height,
            { x: width * element.cornerRadius / 200, y: height * element.cornerRadius / 200 })
          context.clip()
          // Centered cover: crop the source rectangle, never stretch its pixels.
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
          const sw = width / scale, sh = height / scale
          context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, -width / 2, -height / 2, width, height)
        }
      } else {
        drawText(context, element)
      }
      context.restore()
    }
  }
}

export function renderSelectionToCanvas(canvas: HTMLCanvasElement, design: PersonalizationDesign, drawHandles = true) {
  const context = contextFor(canvas)
  const element = design.elements.find(item => item.id === design.selectedElementId)
  if (!element) return
  for (const centerX of wrappedPaintCenters(element, design.space, 40)) {
    context.save()
    context.translate(centerX, element.y)
    context.rotate(element.rotation)
    context.lineWidth = 2
    context.strokeStyle = "#ff2859"
    context.setLineDash([7, 4])
    context.strokeRect(-element.width / 2 + 1, -element.height / 2 + 1, Math.max(1, element.width - 2), Math.max(1, element.height - 2))
    context.setLineDash([])
    if (!drawHandles) { context.restore(); continue }
    const handles = selectionHandles(element, design.space)
    const rotation = handles.find(handle => handle.kind === "rotate")!
    context.beginPath()
    context.moveTo(0, -element.height / 2)
    context.lineTo(rotation.x, rotation.y)
    context.stroke()
    context.fillStyle = "#fffdf9"
    for (const handle of handles) {
      context.beginPath()
      if (handle.kind === "rotate") context.arc(handle.x, handle.y, 7, 0, Math.PI * 2)
      else context.roundRect(handle.x - 6, handle.y - 6, 12, 12, 2)
      context.fill()
      context.stroke()
    }
    context.restore()
  }
}
