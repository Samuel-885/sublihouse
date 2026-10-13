export const DESIGN_WIDTH = 1024
export const DESIGN_HEIGHT = 512
export type PrintableSpace = Readonly<{ wrapX: boolean }>
export const FLAT_SPACE: PrintableSpace = Object.freeze({ wrapX: false })

export type DesignPoint = { x: number; y: number }
type ElementBase = DesignPoint & {
  id: string
  width: number
  height: number
  /** Radians, in canvas coordinates. */
  rotation: number
  zIndex: number
}
export type PhotoElement = ElementBase & {
  type: "photo"; source: string; name: string
  lockAspectRatio: boolean
  /** 0–100; 100 clips to an ellipse without modifying the source. */
  cornerRadius: number
}
export type TextElement = ElementBase & {
  type: "text"
  content: string
  font: "Figtree" | "Arial" | "Georgia"
  fontSize: number
  color: string
  align: "left" | "center" | "right"
}
export type PersonalizationElement = PhotoElement | TextElement
export type PersonalizationDesign = { space: PrintableSpace; elements: PersonalizationElement[]; selectedElementId: string | null }
export type TextUpdate = Partial<Pick<TextElement, "content" | "font" | "fontSize" | "color" | "align">>
