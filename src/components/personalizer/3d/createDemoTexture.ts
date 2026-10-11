import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three"
import type { Personalizer3DConfig } from "./personalizer3dConfig"

// Replace this painter with the future compositor; the model consumes a texture.
export function createDemoTexture({ textureWidth, textureHeight }: Personalizer3DConfig["printableArea"]) {
  const canvas = document.createElement("canvas")
  canvas.width = textureWidth
  canvas.height = textureHeight
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 2D is unavailable")

  context.fillStyle = "#fffdf9"
  context.fillRect(0, 0, textureWidth, textureHeight)
  context.save()
  context.scale(textureWidth / 1024, textureHeight / 512)
  context.fillStyle = "#ffe1e8"
  context.beginPath()
  context.ellipse(490, 242, 116, 150, -0.25, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = "#ff2859"
  context.beginPath()
  context.arc(590, 139, 32, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = "#d7dccd"
  context.beginPath()
  context.ellipse(406, 355, 38, 22, -0.6, 0, Math.PI * 2)
  context.fill()
  context.textAlign = "center"
  context.fillStyle = "#262620"
  context.font = "bold 40px Georgia, serif"
  context.fillText("A tua", 510, 236)
  context.fillText("criação", 510, 286)
  context.font = "15px Arial, sans-serif"
  context.fillText("EXEMPLO · SUBLIME HOUSE", 512, 422)
  context.restore()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.needsUpdate = true
  return texture
}
