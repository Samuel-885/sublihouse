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
  const scale = Math.min(1, (DESIGN_HEIGHT - TEXT_PADDING * 2) / (lines.length * lineHeight))
  return {
    lines, lineHeight: lineHeight * scale, scale,
    width: Math.min(DESIGN_WIDTH, Math.max(1, ...lines.map(line => context.measureText(line).width * scale)) + TEXT_PADDING * 2),
    height: lines.length * lineHeight * scale + TEXT_PADDING * 2,
  }
}
