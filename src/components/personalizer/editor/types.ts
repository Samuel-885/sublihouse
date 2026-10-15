import type { FontFamily } from "./fontCatalog"

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
  fontFamily: FontFamily
  fontSize: number
  fontWeight: number
  fontStyle: "normal" | "italic"
  underline: boolean
  /** Logical pixels, independent of the displayed viewer size. */
  letterSpacing: number
  lineHeight: number
  textTransform: "none" | "uppercase" | "lowercase"
  color: string
  align: "left" | "center" | "right"
}
export type PersonalizationElement = PhotoElement | TextElement
export type PersonalizationDesign = { space: PrintableSpace; elements: PersonalizationElement[]; selectedElementId: string | null }
export type TextUpdate = Partial<Pick<TextElement, "content" | "fontFamily" | "fontSize" | "fontWeight" | "fontStyle" | "underline" | "letterSpacing" | "lineHeight" | "textTransform" | "color" | "align">>
