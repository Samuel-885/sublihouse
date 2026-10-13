export const DESIGN_WIDTH = 1024
export const DESIGN_HEIGHT = 512

export type DesignPoint = { x: number; y: number }
type ElementBase = DesignPoint & {
  id: string
  width: number
  height: number
  /** Radians, in canvas coordinates. */
  rotation: number
  zIndex: number
}
export type PhotoElement = ElementBase & { type: "photo"; source: string; name: string }
export type TextElement = ElementBase & {
  type: "text"
  content: string
  font: "Figtree" | "Arial" | "Georgia"
  fontSize: number
  color: string
  align: "left" | "center" | "right"
}
export type PersonalizationElement = PhotoElement | TextElement
export type PersonalizationDesign = { elements: PersonalizationElement[]; selectedElementId: string | null }
export type TextUpdate = Partial<Pick<TextElement, "content" | "font" | "color" | "align">>
