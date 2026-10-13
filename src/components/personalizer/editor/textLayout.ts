import { DESIGN_HEIGHT, DESIGN_WIDTH, type TextElement } from "./types"

export const TEXT_PADDING = 6
export function canvasFont(element: TextElement, scale = 1) {
  return `${element.fontSize * scale}px "${element.font}", ${element.font === "Georgia" ? "serif" : "sans-serif"}`
}

// Explicit newlines and wrapping use the same layout for paint and hit bounds.
export function layoutText(context: CanvasRenderingContext2D, element: TextElement) {
  context.font = canvasFont(element)
  const lines: string[] = []
  for (const paragraph of element.content.split("\n")) {
    let line = ""
    for (const char of paragraph) {
      if (line && context.measureText(line + char).width > DESIGN_WIDTH - TEXT_PADDING * 2) {
        lines.push(line)
        line = ""
      }
      line += char
    }
    lines.push(line)
  }
  const lineHeight = element.fontSize * 1.3
  const naturalWidth = Math.max(1, ...lines.map(line => context.measureText(line).width))
  const naturalHeight = lines.length * lineHeight
  const c = Math.abs(Math.cos(element.rotation)), s = Math.abs(Math.sin(element.rotation))
  const padding = TEXT_PADDING * 2 * (c + s)
  // Uniform glyph sizing, including long multiline text rotated near the edge.
  const scale = Math.min(1, (DESIGN_WIDTH - padding) / (naturalWidth * c + naturalHeight * s),
    (DESIGN_HEIGHT - padding) / (naturalWidth * s + naturalHeight * c))
  return {
    lines, lineHeight: lineHeight * scale, scale,
    width: naturalWidth * scale + TEXT_PADDING * 2,
    height: lines.length * lineHeight * scale + TEXT_PADDING * 2,
  }
}
