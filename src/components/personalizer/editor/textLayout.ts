import { DESIGN_HEIGHT, DESIGN_WIDTH, type TextElement } from "./types"
import { canvasFont } from "./fontCatalog"

export const TEXT_PADDING = 6
const segmenter = new Intl.Segmenter("pt", { granularity: "grapheme" })
const graphemes = (text: string) => Array.from(segmenter.segment(text), part => part.segment)

export function displayText(element: TextElement) {
  return element.textTransform === "uppercase" ? element.content.toLocaleUpperCase("pt")
    : element.textTransform === "lowercase" ? element.content.toLocaleLowerCase("pt") : element.content
}

/** Shared glyph positions and ink bounds for paint and hit bounds. Zero tracking
 * preserves native shaping/kerning and script ligatures. */
export function measureTextLine(context: CanvasRenderingContext2D, text: string, letterSpacing: number) {
  const glyphs: { text: string; x: number }[] = []
  let advance = 0, left = 0, right = 0, ascent = 0, descent = 0
  const runs = letterSpacing === 0 ? [text] : graphemes(text)
  runs.forEach((run, index) => {
    const metrics = context.measureText(run)
    glyphs.push({ text: run, x: advance })
    left = Math.min(left, advance - metrics.actualBoundingBoxLeft)
    right = Math.max(right, advance + metrics.actualBoundingBoxRight)
    ascent = Math.max(ascent, metrics.actualBoundingBoxAscent)
    descent = Math.max(descent, metrics.actualBoundingBoxDescent)
    advance += metrics.width + (index < runs.length - 1 ? letterSpacing : 0)
  })
  return { text, glyphs, left, width: Math.max(0, right, advance) - left, ascent, descent }
}

export function layoutText(context: CanvasRenderingContext2D, element: TextElement) {
  context.font = canvasFont(element)
  context.textAlign = "left"
  context.textBaseline = "alphabetic"
  const measure = (line: string) => measureTextLine(context, line, element.letterSpacing)
  const lines: ReturnType<typeof measure>[] = []
  for (const paragraph of displayText(element).split("\n")) {
    let line = ""
    for (const char of graphemes(paragraph)) {
      if (line && measure(line + char).width > DESIGN_WIDTH - TEXT_PADDING * 2) {
        lines.push(measure(line)); line = ""
      }
      line += char
    }
    lines.push(measure(line))
  }
  const lineHeight = element.fontSize * element.lineHeight
  const underlineY = element.fontSize * .12
  const underlineThickness = Math.max(1, element.fontSize * .05)
  const ascent = Math.max(element.fontSize * .8, ...lines.map(line => line.ascent))
  const descent = Math.max(element.fontSize * .2, ...lines.map(line => line.descent), element.underline ? underlineY + underlineThickness / 2 : 0)
  const naturalWidth = Math.max(1, ...lines.map(line => line.width))
  const naturalHeight = ascent + descent + (lines.length - 1) * lineHeight
  const c = Math.abs(Math.cos(element.rotation)), s = Math.abs(Math.sin(element.rotation))
  const padding = TEXT_PADDING * 2 * (c + s)
  const scale = Math.min(1, (DESIGN_WIDTH - padding) / (naturalWidth * c + naturalHeight * s),
    (DESIGN_HEIGHT - padding) / (naturalWidth * s + naturalHeight * c))
  return { lines, lineHeight, ascent, naturalWidth, underlineY, underlineThickness, scale,
    width: naturalWidth * scale + TEXT_PADDING * 2, height: naturalHeight * scale + TEXT_PADDING * 2 }
}

export function drawText(context: CanvasRenderingContext2D, element: TextElement) {
  const layout = layoutText(context, element)
  context.save()
  context.translate(-layout.width / 2 + TEXT_PADDING, -layout.height / 2 + TEXT_PADDING)
  // Uniform fit only, never independent X/Y glyph stretching.
  context.scale(layout.scale, layout.scale)
  context.fillStyle = context.strokeStyle = element.color
  context.lineWidth = layout.underlineThickness
  layout.lines.forEach((line, index) => {
    const x = element.align === "left" ? 0 : (layout.naturalWidth - line.width) * (element.align === "right" ? 1 : .5)
    const baseline = layout.ascent + index * layout.lineHeight
    line.glyphs.forEach(glyph => context.fillText(glyph.text, x - line.left + glyph.x, baseline))
    if (element.underline && line.width > 0) {
      context.beginPath()
      context.moveTo(x, baseline + layout.underlineY)
      context.lineTo(x + line.width, baseline + layout.underlineY)
      context.stroke()
    }
  })
  context.restore()
}
