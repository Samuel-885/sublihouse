import { constrainElement } from "./geometry"
import { layoutText } from "./textLayout"
import { DESIGN_HEIGHT, DESIGN_WIDTH, type PersonalizationDesign, type PersonalizationElement, type TextElement, type TextUpdate } from "./types"

export const MAX_PHOTO_BYTES = 20 * 1024 * 1024
const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"])
type PhotoResource = { image: HTMLImageElement; cancel: () => void }

export function createDesignStore() {
  let design: PersonalizationDesign = { elements: [], selectedElementId: null }
  let snapshot = design
  let epoch = 0
  let measureCanvas: HTMLCanvasElement | null = null
  const photos = new Map<string, PhotoResource>()
  const paintListeners = new Set<() => void>()
  const uiListeners = new Set<() => void>()
  const subscribeTo = (listeners: Set<() => void>, listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }
  function publish(commit = true) {
    paintListeners.forEach(listener => listener())
    if (commit) {
      snapshot = design
      uiListeners.forEach(listener => listener())
    }
  }
  function release(source: string) {
    const resource = photos.get(source)
    if (!resource) return
    photos.delete(source)
    resource.cancel()
    resource.image.onload = resource.image.onerror = null
    resource.image.removeAttribute("src")
    URL.revokeObjectURL(source)
  }
  function measure(element: TextElement): TextElement {
    measureCanvas ??= document.createElement("canvas")
    const context = measureCanvas.getContext("2d")
    if (!context) throw new Error("Canvas 2D is unavailable")
    const { width, height } = layoutText(context, element)
    return constrainElement({ ...element, width, height })
  }
  function base() {
    return { id: crypto.randomUUID(), x: DESIGN_WIDTH / 2, y: DESIGN_HEIGHT / 2,
      width: 280, height: 280, rotation: 0,
      zIndex: Math.max(0, ...design.elements.map(element => element.zIndex)) + 1 }
  }
  function insert(element: PersonalizationElement) {
    design = { elements: [...design.elements, element], selectedElementId: element.id }
    publish()
  }
  async function loadPhoto(file: File) {
    if (!photoTypes.has(file.type)) throw new Error("Escolhe uma imagem JPG, PNG ou WebP.")
    if (file.size > MAX_PHOTO_BYTES) throw new Error("A imagem deve ter no máximo 20 MB.")
    const source = URL.createObjectURL(file)
    const image = new Image()
    const started = epoch
    try {
      await new Promise<void>((resolve, reject) => {
        photos.set(source, { image, cancel: () => reject(new Error("Carregamento cancelado.")) })
        image.onload = () => { image.onload = image.onerror = null; resolve() }
        image.onerror = () => reject(new Error("Não foi possível abrir esta imagem. Escolhe outro ficheiro."))
        image.src = source
      })
      if (started !== epoch) return null
      return { source, image }
    } catch (error) {
      release(source)
      if (started !== epoch) return null
      throw error
    }
  }

  return {
    getDesign: () => design,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => subscribeTo(uiListeners, listener),
    subscribePaint: (listener: () => void) => subscribeTo(paintListeners, listener),
    getPhoto: (source: string) => photos.get(source)?.image,
    select(id: string | null) {
      const selectedElementId = design.elements.some(element => element.id === id) ? id : null
      if (design.selectedElementId === selectedElementId) return
      design = { ...design, selectedElementId }
      publish()
    },
    async addPhoto(file: File) {
      const loaded = await loadPhoto(file)
      if (!loaded) return
      const scale = 280 / Math.max(loaded.image.naturalWidth, loaded.image.naturalHeight)
      insert({ ...base(), type: "photo", source: loaded.source, name: file.name,
        width: loaded.image.naturalWidth * scale, height: loaded.image.naturalHeight * scale })
    },
    async replacePhoto(id: string, file: File) {
      const loaded = await loadPhoto(file)
      if (!loaded) return
      const previous = design.elements.find(element => element.id === id)
      if (previous?.type !== "photo") { release(loaded.source); return }
      design = { ...design, elements: design.elements.map(element => element.id === id
        ? { ...previous, source: loaded.source, name: file.name } : element) }
      release(previous.source)
      publish()
    },
    addText() {
      insert(measure({ ...base(), type: "text", content: "O teu texto", font: "Figtree", fontSize: 36, color: "#262620", align: "center" }))
    },
    updateText(id: string, update: TextUpdate) {
      design = { ...design, elements: design.elements.map(element => element.id === id && element.type === "text"
        ? measure({ ...element, ...update }) : element) }
      publish()
    },
    refreshTextMetrics() {
      design = { ...design, elements: design.elements.map(element => element.type === "text" ? measure(element) : element) }
      publish()
    },
    // Paint subscribers get every move; React sees a stable snapshot until commit.
    move(id: string, x: number, y: number) {
      design = { ...design, elements: design.elements.map(element => element.id === id
        ? constrainElement({ ...element, x, y }) : element) }
      publish(false)
    },
    commit() { publish() },
    remove(id: string) {
      const element = design.elements.find(item => item.id === id)
      design = { elements: design.elements.filter(item => item.id !== id), selectedElementId: null }
      if (element?.type === "photo") release(element.source)
      publish()
    },
    cleanup() {
      epoch++
      for (const source of photos.keys()) release(source)
      measureCanvas = null
      design = snapshot = { elements: [], selectedElementId: null }
      paintListeners.clear()
      uiListeners.clear()
    },
  }
}
export type DesignStore = ReturnType<typeof createDesignStore>
