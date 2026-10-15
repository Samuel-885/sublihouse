/** Bundled, unmodified Google Fonts; see each directory's OFL and metadata. */
const weights = [400, 500, 600, 700] as const
export const fontCatalog = [
  { family: "Figtree", label: "Figtree", category: "Modernas", weights, italic: true, fallback: "sans-serif", directory: "figtree", normal: "Figtree-wght.ttf", italics: "Figtree-Italic-wght.ttf" },
  { family: "Montserrat", label: "Montserrat", category: "Modernas", weights, italic: true, fallback: "sans-serif", directory: "montserrat", normal: "Montserrat-wght.ttf", italics: "Montserrat-Italic-wght.ttf" },
  { family: "Poppins", label: "Poppins", category: "Modernas", weights, italic: true, fallback: "sans-serif", directory: "poppins", normal: "", italics: "" },
  { family: "Archivo", label: "Archivo", category: "Modernas", weights, italic: true, fallback: "sans-serif", directory: "archivo", normal: "Archivo-wdth,wght.ttf", italics: "Archivo-Italic-wdth,wght.ttf" },
  { family: "Playfair Display", label: "Playfair Display", category: "Elegantes", weights, italic: true, fallback: "serif", directory: "playfairdisplay", normal: "PlayfairDisplay-wght.ttf", italics: "PlayfairDisplay-Italic-wght.ttf" },
  { family: "Cormorant Garamond", label: "Cormorant Garamond", category: "Elegantes", weights, italic: true, fallback: "serif", directory: "cormorantgaramond", normal: "CormorantGaramond-wght.ttf", italics: "CormorantGaramond-Italic-wght.ttf" },
  { family: "DM Serif Display", label: "DM Serif Display", category: "Elegantes", weights: [400], italic: true, fallback: "serif", directory: "dmserifdisplay", normal: "DMSerifDisplay-Regular.ttf", italics: "DMSerifDisplay-Italic.ttf" },
  { family: "Caveat", label: "Caveat", category: "Manuscritas", weights, italic: false, fallback: "cursive", directory: "caveat", normal: "Caveat-wght.ttf", italics: "" },
  { family: "Dancing Script", label: "Dancing Script", category: "Manuscritas", weights, italic: false, fallback: "cursive", directory: "dancingscript", normal: "DancingScript-wght.ttf", italics: "" },
  { family: "Pacifico", label: "Pacifico", category: "Manuscritas", weights: [400], italic: false, fallback: "cursive", directory: "pacifico", normal: "Pacifico-Regular.ttf", italics: "" },
  { family: "Fredoka", label: "Fredoka", category: "Divertidas", weights, italic: false, fallback: "sans-serif", directory: "fredoka", normal: "Fredoka-wdth,wght.ttf", italics: "" },
  { family: "Baloo 2", label: "Baloo 2", category: "Divertidas", weights, italic: false, fallback: "sans-serif", directory: "baloo2", normal: "Baloo2-wght.ttf", italics: "" },
] as const
export type FontFamily = typeof fontCatalog[number]["family"]
export const defaultFontFamily: FontFamily = fontCatalog[0].family
export const fontCategories = [...new Set(fontCatalog.map(font => font.category))]
export const weightLabels: Record<number, string> = { 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold" }
export function resolveFont(family: FontFamily) {
  return fontCatalog.find(font => font.family === family) ?? fontCatalog[0]
}
export function supportedWeight(family: FontFamily, weight: number) {
  return resolveFont(family).weights.reduce<number>((best, next) => Math.abs(next - weight) < Math.abs(best - weight) ? next : best, 400)
}
type FontRequest = { fontFamily: FontFamily; fontStyle: "normal" | "italic"; fontWeight: number }
export function fontKey(element: FontRequest) {
  return `${element.fontFamily}/${element.fontStyle}/${element.fontWeight}`
}
// Private CSS families avoid collisions with the site's external UI fonts.
export function fontStack(family: FontFamily) {
  const font = resolveFont(family)
  return `"Sublime ${font.family}", ${font.fallback}`
}
export function canvasFont(element: FontRequest & { fontSize: number }) {
  return `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${fontStack(element.fontFamily)}`
}
const loads = new Map<string, Promise<boolean>>()
export function loadFont(element: FontRequest): Promise<boolean> {
  const key = fontKey(element)
  const pending = loads.get(key)
  if (pending) return pending
  const font = resolveFont(element.fontFamily)
  const italic = element.fontStyle === "italic" && font.italic
  const weight = supportedWeight(font.family, element.fontWeight)
  const poppinsNames: Record<number, string> = { 400: italic ? "Italic" : "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold" }
  const file = font.family === "Poppins"
    ? `Poppins-${poppinsNames[weight]}${italic && weight !== 400 ? "Italic" : ""}.ttf`
    : italic ? font.italics : font.normal
  const request = (async () => {
    try {
      const face = new FontFace(`Sublime ${font.family}`, `url("${import.meta.env.BASE_URL}fonts/personalizer/${font.directory}/${file}")`,
        { style: italic ? "italic" : "normal", weight: String(weight), display: "swap" })
      await face.load()
      document.fonts.add(face)
      await document.fonts.load(canvasFont({ ...element, fontSize: 36 }))
      return true
    } catch {
      // Keep the safe generic fallback; a failed request must not break paint.
      return false
    }
  })()
  loads.set(key, request)
  return request
}
