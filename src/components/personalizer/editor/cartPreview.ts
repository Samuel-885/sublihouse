import type { DesignCustomization } from "../../../context/CartContext"
import type { MugVariant } from "../mugVariants"
import { createDesignCanvas, renderDesignToCanvas } from "./compositor"
import { displayText } from "./textLayout"
import type { PersonalizationDesign } from "./types"

export function summarizeDesign(design: PersonalizationDesign): DesignCustomization["design"] {
  return {
    texts: design.elements.filter(element => element.type === "text").map(displayText).filter(text => text.trim()),
    photoCount: design.elements.filter(element => element.type === "photo").length,
  }
}

// Only the flattened, bounded data URL leaves this function. Original photos
// and their temporary URLs remain exclusively in the editor's resource store.
export function createCartPreview(design: PersonalizationDesign, variant: MugVariant, getPhoto: (source: string) => HTMLImageElement | undefined): string {
  for (const element of design.elements) {
    if (element.type === "photo") {
      const photo = getPhoto(element.source)
      if (!photo?.complete || !photo.naturalWidth) throw new Error("Photo unavailable")
    }
  }
  const artwork = createDesignCanvas()
  renderDesignToCanvas(artwork, design, getPhoto)
  const preview = document.createElement("canvas")
  preview.width = 600
  preview.height = 300
  const context = preview.getContext("2d")
  if (!context) throw new Error("Canvas unavailable")
  context.fillStyle = variant.ceramicColor
  context.fillRect(0, 0, preview.width, preview.height)
  if (variant.pattern) {
    context.fillStyle = variant.pattern.color
    for (let y = 12; y < preview.height; y += 24) {
      for (let x = 12; x < preview.width; x += 24) {
        context.beginPath()
        context.arc(x, y, 2, 0, Math.PI * 2)
        context.fill()
      }
    }
  }
  context.imageSmoothingQuality = "high"
  context.drawImage(artwork, 0, 0, preview.width, preview.height)
  let data = preview.toDataURL("image/webp", 0.75)
  if (!data.startsWith("data:image/webp;base64,")) data = preview.toDataURL("image/jpeg", 0.7)
  if (!/^data:image\/(webp|jpeg);base64,/.test(data) || data.length > 200_000) {
    throw new Error("Preview unavailable or too large")
  }
  return data
}
