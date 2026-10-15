import { constrainElement, MAX_FONT_SIZE, MIN_FONT_SIZE, MIN_PHOTO_SIZE, resizeFromPointer, rotatedExtents, toDesign, type ResizeHandle, type TransformHandle } from "./geometry"
import { layoutText } from "./textLayout"
import { defaultFontFamily, fontKey, loadFont, resolveFont, supportedWeight } from "./fontCatalog"
import { DESIGN_HEIGHT, DESIGN_WIDTH, FLAT_SPACE, type PrintableSpace, type DesignPoint, type PersonalizationDesign, type PersonalizationElement, type TextElement, type TextUpdate } from "./types"

export const MAX_PHOTO_BYTES = 20 * 1024 * 1024
export const HISTORY_LIMIT = 50
const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"])
type PhotoResource = { image: HTMLImageElement; cancel: () => void }
const sameElements = (a: PersonalizationDesign, b: PersonalizationDesign) => JSON.stringify(a.elements) === JSON.stringify(b.elements)
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function createDesignStore(printableSpace: PrintableSpace = FLAT_SPACE) {
  const space = Object.freeze({ ...printableSpace })
  const constrain = <T extends PersonalizationElement>(element: T) => constrainElement(element, space)
  let design: PersonalizationDesign = { space, elements: [], selectedElementId: null }
  let snapshot = design
  let past: PersonalizationDesign[] = [], future: PersonalizationDesign[] = []
  let transaction: PersonalizationDesign | null = null
  let epoch = 0
  let measureCanvas: HTMLCanvasElement | null = null
  const requestedFonts = new Set<string>()
  const photos = new Map<string, PhotoResource>()
  const pendingPhotos = new Set<string>()
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
    pendingPhotos.delete(source)
    resource.cancel()
    resource.image.onload = resource.image.onerror = null
    resource.image.removeAttribute("src")
    URL.revokeObjectURL(source)
  }
  function collectPhotos() {
    const retained = new Set(pendingPhotos)
    for (const state of [design, ...past, ...future, ...(transaction ? [transaction] : [])]) {
      for (const element of state.elements) if (element.type === "photo") retained.add(element.source)
    }
    for (const source of photos.keys()) if (!retained.has(source)) release(source)
  }
  function remember(before: PersonalizationDesign) {
    if (sameElements(before, design)) return
    past = [...past, before].slice(-HISTORY_LIMIT)
    future = []
  }
  function begin() { transaction ??= design }
  function commit() {
    if (transaction) { remember(transaction); transaction = null }
    collectPhotos()
    // A fresh identity also publishes history-only changes after a panel gesture.
    design = { ...design }
    publish()
  }
  function change(next: PersonalizationDesign, transient = false) {
    if (sameElements(design, next)) return
    if (transient) begin()
    const before = design
    design = next
    if (!transaction) { remember(before); collectPhotos() }
    publish(!transient)
  }
  function measure(element: TextElement): TextElement {
    measureCanvas ??= document.createElement("canvas")
    const context = measureCanvas.getContext("2d")
    if (!context) throw new Error("Canvas 2D is unavailable")
    const font = resolveFont(element.fontFamily)
    const sized: TextElement = { ...element, fontFamily: font.family,
      fontSize: clamp(element.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE),
      fontWeight: supportedWeight(font.family, element.fontWeight),
      fontStyle: font.italic ? element.fontStyle : "normal",
      letterSpacing: clamp(element.letterSpacing, -5, 30), lineHeight: clamp(element.lineHeight, .8, 2) }
    const key = fontKey(sized)
    if (!requestedFonts.has(key)) {
      requestedFonts.add(key)
      const started = epoch
      void loadFont(sized).then(() => { if (started === epoch) refreshTextMetrics() })
    }
    const { width, height } = layoutText(context, sized)
    return constrain({ ...sized, width, height })
  }
  function fit(element: PersonalizationElement): PersonalizationElement {
    if (element.type === "text") return measure(element)
    const sized = { ...element, width: Math.max(MIN_PHOTO_SIZE, element.width), height: Math.max(MIN_PHOTO_SIZE, element.height) }
    // Scale excess above the minimum, preserving the ratio when possible.
    const extent = rotatedExtents(sized)
    const scale = Math.min(1, DESIGN_WIDTH / (extent.x * 2), DESIGN_HEIGHT / (extent.y * 2))
    if (scale < 1) {
      sized.width *= scale; sized.height *= scale
      if (sized.width < MIN_PHOTO_SIZE || sized.height < MIN_PHOTO_SIZE) {
        const c = Math.abs(Math.cos(sized.rotation)), s = Math.abs(Math.sin(sized.rotation))
        sized.width = Math.max(MIN_PHOTO_SIZE, sized.width)
        sized.height = Math.max(MIN_PHOTO_SIZE, sized.height)
        if (sized.width === MIN_PHOTO_SIZE) sized.height = Math.min(sized.height, c ? (DESIGN_HEIGHT - sized.width * s) / c : Infinity, s ? (DESIGN_WIDTH - sized.width * c) / s : Infinity)
        if (sized.height === MIN_PHOTO_SIZE) sized.width = Math.min(sized.width, c ? (DESIGN_WIDTH - sized.height * s) / c : Infinity, s ? (DESIGN_HEIGHT - sized.height * c) / s : Infinity)
      }
    }
    return constrain(sized)
  }
  function update(id: string, fn: (element: PersonalizationElement) => PersonalizationElement, transient = false) {
    change({ ...design, elements: design.elements.map(element => element.id === id ? fn(element) : element) }, transient)
  }
  function base(point?: DesignPoint) {
    const valid = point && Number.isFinite(point.x) && Number.isFinite(point.y)
    return { id: crypto.randomUUID(), x: valid ? point.x : DESIGN_WIDTH / 2, y: valid ? point.y : DESIGN_HEIGHT / 2,
      width: 280, height: 280, rotation: 0,
      zIndex: Math.max(0, ...design.elements.map(element => element.zIndex)) + 1 }
  }
  function insert(element: PersonalizationElement) {
    commit()
    change({ space, elements: [...design.elements, element], selectedElementId: element.id })
  }
  async function loadPhoto(file: File) {
    if (!photoTypes.has(file.type)) throw new Error("Escolhe uma imagem JPG, PNG ou WebP.")
    if (file.size > MAX_PHOTO_BYTES) throw new Error("A imagem deve ter no máximo 20 MB.")
    const source = URL.createObjectURL(file)
    const image = new Image()
    const started = epoch
    pendingPhotos.add(source)
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
  function reorder(id: string, front: boolean) {
    commit()
    const element = design.elements.find(item => item.id === id)
    if (!element) return
    const ordered = design.elements.filter(item => item.id !== id).sort((a, b) => a.zIndex - b.zIndex)
    if (front) ordered.push(element); else ordered.unshift(element)
    const indices = new Map(ordered.map((item, index) => [item.id, index]))
    change({ ...design, elements: design.elements.map(item => ({ ...item, zIndex: indices.get(item.id)! })) })
  }
  function restore(state: PersonalizationDesign) {
    // Preserve current selection only if it survives the restored design.
    design = { ...state, selectedElementId: state.elements.some(e => e.id === design.selectedElementId) ? design.selectedElementId : null }
    collectPhotos()
    publish()
  }

  function refreshTextMetrics() {
    // Font completion is not an edit. Refresh history and active transactions too,
    // without restoring the content/selection captured by an earlier request.
    const refresh = (state: PersonalizationDesign) => ({ ...state, elements: state.elements.map(element => element.type === "text" ? measure(element) : element) })
    design = refresh(design); past = past.map(refresh); future = future.map(refresh)
    if (transaction) transaction = refresh(transaction)
    publish()
  }

  return {
    getDesign: () => design,
    getSnapshot: () => snapshot,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    subscribe: (listener: () => void) => subscribeTo(uiListeners, listener),
    subscribePaint: (listener: () => void) => subscribeTo(paintListeners, listener),
    getPhoto: (source: string) => photos.get(source)?.image,
    begin, commit,
    select(id: string | null) {
      const selectedElementId = design.elements.some(element => element.id === id) ? id : null
      if (design.selectedElementId === selectedElementId) return
      commit()
      design = { ...design, selectedElementId }
      publish()
    },
    async addPhoto(file: File, point?: DesignPoint) {
      const loaded = await loadPhoto(file)
      if (!loaded) return
      const scale = 280 / Math.max(loaded.image.naturalWidth, loaded.image.naturalHeight)
      insert(fit({ ...base(point), type: "photo", source: loaded.source, name: file.name, lockAspectRatio: true, cornerRadius: 0,
        width: loaded.image.naturalWidth * scale, height: loaded.image.naturalHeight * scale }))
      pendingPhotos.delete(loaded.source)
    },
    async replacePhoto(id: string, file: File) {
      const loaded = await loadPhoto(file)
      if (!loaded) return
      commit()
      const previous = design.elements.find(element => element.id === id)
      if (previous?.type !== "photo") { release(loaded.source); return }
      update(id, () => ({ ...previous, source: loaded.source, name: file.name }))
      pendingPhotos.delete(loaded.source)
    },
    addText(point?: DesignPoint) {
      insert(measure({ ...base(point), type: "text", content: "O teu texto", fontFamily: defaultFontFamily,
        fontSize: 36, fontWeight: 400, fontStyle: "normal", underline: false, letterSpacing: 0,
        lineHeight: 1.3, textTransform: "none", color: "#262620", align: "center" }))
    },
    updateText(id: string, updateText: TextUpdate) {
      for (const key of ["fontSize", "fontWeight", "letterSpacing", "lineHeight"] as const) {
        if (updateText[key] !== undefined && !Number.isFinite(updateText[key])) return
      }
      update(id, element => element.type === "text" ? measure({ ...element, ...updateText }) : element)
    },
    refreshTextMetrics,
    move(id: string, x: number, y: number, transient = true) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return
      update(id, element => constrain({ ...element, x, y }), transient)
    },
    resizeElement(id: string, axis: "width" | "height", value: number) {
      if (!Number.isFinite(value)) return
      update(id, element => {
        if (element.type !== "photo") return element
        const size = Math.max(MIN_PHOTO_SIZE, value)
        const scale = element.lockAspectRatio ? Math.max(size / element[axis], MIN_PHOTO_SIZE / Math.min(element.width, element.height)) : 1
        return fit(element.lockAspectRatio ? { ...element, width: element.width * scale, height: element.height * scale } : { ...element, [axis]: size })
      })
    },
    rotateElement(id: string, rotation: number) {
      if (!Number.isFinite(rotation)) return
      update(id, element => fit({ ...element, rotation: Math.atan2(Math.sin(rotation), Math.cos(rotation)) }))
    },
    setPhotoCorners(id: string, cornerRadius: number) {
      if (!Number.isFinite(cornerRadius)) return
      update(id, element => element.type === "photo" ? { ...element, cornerRadius: clamp(cornerRadius, 0, 100) } : element)
    },
    setAspectLock(id: string, lockAspectRatio: boolean) {
      update(id, element => element.type === "photo" ? { ...element, lockAspectRatio } : element)
    },
    // Every pointer move is derived from the original element, never the last
    // rounded/clamped frame. The opposite edge/corner is the resize anchor.
    transform(initial: PersonalizationElement, handle: TransformHandle, start: DesignPoint, point: DesignPoint) {
      if (handle === "rotate") {
        const angle = Math.atan2(point.y - initial.y, point.x - initial.x) - Math.atan2(start.y - initial.y, start.x - initial.x)
        const rotation = Math.atan2(Math.sin(initial.rotation + angle), Math.cos(initial.rotation + angle))
        update(initial.id, () => fit({ ...initial, rotation }), true)
      } else {
        const { width, height, sx, sy } = resizeFromPointer(initial, handle as ResizeHandle, start, point)
        const sized = fit(initial.type === "text" ? { ...initial, fontSize: initial.fontSize * width / initial.width } : { ...initial, width, height })
        const center = toDesign(initial, { x: sx * (sized.width - initial.width) / 2, y: sy * (sized.height - initial.height) / 2 })
        update(initial.id, () => constrain({ ...sized, ...center }), true)
      }
    },
    duplicate(id: string) {
      const element = design.elements.find(item => item.id === id)
      if (element) insert(constrain({ ...element, id: crypto.randomUUID(), x: element.x + 20, y: element.y + 20, zIndex: base().zIndex }))
    },
    bringForward: (id: string) => reorder(id, true),
    sendBackward: (id: string) => reorder(id, false),
    remove(id: string) {
      commit()
      change({ space, elements: design.elements.filter(item => item.id !== id), selectedElementId: design.selectedElementId === id ? null : design.selectedElementId })
    },
    undo() {
      commit()
      const previous = past.at(-1)
      if (!previous) return
      past = past.slice(0, -1); future = [...future, design]
      restore(previous)
    },
    redo() {
      commit()
      const next = future.at(-1)
      if (!next) return
      future = future.slice(0, -1); past = [...past, design].slice(-HISTORY_LIMIT)
      restore(next)
    },
    cleanup() {
      epoch++
      for (const source of photos.keys()) release(source)
      pendingPhotos.clear()
      requestedFonts.clear()
      measureCanvas = null
      design = snapshot = { space, elements: [], selectedElementId: null }
      past = []; future = []; transaction = null
      paintListeners.clear()
      uiListeners.clear()
    },
  }
}
export type DesignStore = ReturnType<typeof createDesignStore>
