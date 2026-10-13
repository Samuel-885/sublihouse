import { canvasFont, layoutText, TEXT_PADDING } from "./textLayout"
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
    context.save()
    context.translate(element.x, element.y)
    context.rotate(element.rotation)
    if (element.type === "photo") {
      const image = getPhoto(element.source)
      if (image) {
        // Replacements retain the original box and fit without stretching/cropping.
        const scale = Math.min(element.width / image.naturalWidth, element.height / image.naturalHeight)
        const width = image.naturalWidth * scale, height = image.naturalHeight * scale
        context.drawImage(image, -width / 2, -height / 2, width, height)
      }
    } else {
      const layout = layoutText(context, element)
      context.font = canvasFont(element, layout.scale)
      context.fillStyle = element.color
      context.textAlign = element.align
      context.textBaseline = "middle"
      const x = element.align === "left" ? -element.width / 2 + TEXT_PADDING
        : element.align === "right" ? element.width / 2 - TEXT_PADDING : 0
      layout.lines.forEach((line, index) => context.fillText(line, x, -element.height / 2 + TEXT_PADDING + (index + 0.5) * layout.lineHeight))
    }
    context.restore()
  }
}

export function renderSelectionToCanvas(canvas: HTMLCanvasElement, design: PersonalizationDesign) {
  const context = contextFor(canvas)
  const element = design.elements.find(item => item.id === design.selectedElementId)
  if (!element) return
  context.save()
  context.translate(element.x, element.y)
  context.rotate(element.rotation)
  context.lineWidth = 2
  context.strokeStyle = "#ff2859"
  context.setLineDash([7, 4])
  context.strokeRect(-element.width / 2 + 1, -element.height / 2 + 1, Math.max(1, element.width - 2), Math.max(1, element.height - 2))
  context.restore()
}
