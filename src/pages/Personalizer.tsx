import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Link, useParams, useSearchParams } from "react-router"
import { products } from "../data/products"
import type { Product } from "../types/product"
import PersonalizerViewer, { type PersonalizerViewerHandle } from "../components/personalizer/PersonalizerViewer"
import PersonalizerToolbar from "../components/personalizer/PersonalizerToolbar"
import PersonalizerPanel from "../components/personalizer/PersonalizerPanel"
import PersonalizerBottomSheet from "../components/personalizer/PersonalizerBottomSheet"
import type { PersonalizerTool } from "../components/personalizer/types"
import { createDesignStore } from "../components/personalizer/editor/createDesignStore"
import { getPersonalizer3DConfig } from "../components/personalizer/3d/personalizer3dConfig"
import "../components/personalizer/personalizer.css"

function PersonalizerWorkspace({ product, cartItemId }: { product: Product; cartItemId: string | null }) {
  const [store] = useState(() => createDesignStore({ wrapX: getPersonalizer3DConfig(product)?.printableArea.wrapX ?? false }))
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; store.cleanup() }
  }, [store])
  const design = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const selectedElement = design.elements.find(element => element.id === design.selectedElementId) ?? null
  const activeTool: PersonalizerTool = selectedElement?.type ?? "default"
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const photoInput = useRef<HTMLInputElement>(null)
  const viewer = useRef<PersonalizerViewerHandle>(null)
  const replacementId = useRef<string | null>(null)
  const [isEditor, setIsEditor] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const isEditingExistingItem = Boolean(cartItemId)

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target
      if (!isEditor || !available || busy || event.defaultPrevented || event.isComposing ||
        (target instanceof HTMLElement && (target.closest("input,textarea,select") || target.isContentEditable))) return
      const command = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (command && !event.altKey && (key === "z" || key === "y")) {
        event.preventDefault()
        if (key === "y" || event.shiftKey) store.redo(); else store.undo()
      } else if (!command && !event.altKey && (key === "delete" || key === "backspace")) {
        const id = store.getDesign().selectedElementId
        if (id) { event.preventDefault(); store.remove(id) }
      }
    }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  }, [available, busy, isEditor, store])

  function revealWorkspace() {
    // Position after the editor has laid out.
    requestAnimationFrame(() => {
      workspaceRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      })
    })
  }

  function startCreating() {
    setIsEditor(true)
    setIsExpanded(true)
    revealWorkspace()
    requestAnimationFrame(() => workspaceRef.current?.querySelector<HTMLButtonElement>(".pz-tool:not(:disabled)")?.focus({ preventScroll: true }))
  }

  function choosePhoto(id: string | null = null) {
    replacementId.current = id
    setUploadError("")
    photoInput.current?.click()
  }

  function addContent(tool: PersonalizerTool) {
    if (!available || busy) return
    if (!isEditor) startCreating()
    if (tool === "photo") choosePhoto()
    if (tool === "text") store.addText(viewer.current?.getInsertionPoint())
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    const id = replacementId.current
    event.currentTarget.value = ""
    if (!file) return
    setBusy(true)
    setUploadError("")
    try {
      if (id) await store.replacePhoto(id, file)
      else await store.addPhoto(file, viewer.current?.getInsertionPoint())
    } catch (error) {
      if (mounted.current) setUploadError(error instanceof Error ? error.message : "Não foi possível abrir a imagem.")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  return (
    <section className="personalizer" id="home-conteudo" data-mode={isEditingExistingItem ? "edit" : "new"}>
      <div className="pz-intro"><div className="pz-container">
        <p className="pz-eyebrow">Personalização</p>
        <h1>Cria diretamente na tua peça.</h1>
        <p className="pz-intro-copy">Adiciona fotografias, textos e detalhes e acompanha a tua criação diretamente na peça.</p>
      </div></div>
      <div className="pz-container pz-studio">
        <div className="pz-product-heading">
          <div><p className="pz-label">Estás a personalizar</p><h2>{product.name}</h2></div>
          <Link to={`/products/${product.id}`} className="pz-back"><ArrowLeft size={14} /> Ver produto</Link>
        </div>
        {isEditingExistingItem && <p className="pz-edit-notice" role="status">Edição de personalização · A recuperação da tua criação estará disponível em breve.</p>}
        <div ref={workspaceRef} className={`pz-workspace${isEditor ? " pz-workspace-editing" : ""}`}>
          <div className="pz-stage">
            <PersonalizerViewer ref={viewer} product={product} store={store} editing={isEditor} onAvailabilityChange={setAvailable} />
            <PersonalizerToolbar activeTool={activeTool} onSelect={addContent} available={available} busy={busy} store={store} />
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadPhoto} aria-label="Escolher fotografia" />
            {busy && <p className="pz-upload-status" role="status">A preparar fotografia…</p>}
            {uploadError && <p className="pz-upload-status" role="alert">{uploadError}</p>}
          </div>
          <PersonalizerBottomSheet activeTool={activeTool} expanded={isExpanded} onToggle={() => {
            setIsExpanded(!isExpanded)
          }}>
            <PersonalizerPanel product={product} quantity={quantity} onQuantityChange={setQuantity} activeTool={activeTool} isEditor={isEditor} selectedElement={selectedElement} store={store} onReplacePhoto={() => choosePhoto(selectedElement?.id ?? null)} busy={busy} available={available} onStart={startCreating} onChangeMethod={() => {
              setIsEditor(false)
              store.select(null)
              requestAnimationFrame(() => workspaceRef.current?.querySelector<HTMLButtonElement>(".pz-method button")?.focus())
            }} />
          </PersonalizerBottomSheet>
        </div>
      </div>
    </section>
  )
}

export default function Personalizer() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const cartItemId = searchParams.get("cartItemId")?.trim() || null
  const product = products.find(item => item.id === Number(id))
  if (!product || !product.customizable) {
    return <section className="personalizer pz-unavailable" id="home-conteudo"><div className="pz-container">
      <p className="pz-eyebrow">Personalização</p>
      <h1>{product ? "Este produto não é personalizável." : "Produto não encontrado."}</h1>
      <Link className="pz-button pz-button-primary" to={product ? `/products/${product.id}` : "/products"}>{product ? "Voltar ao produto" : "Ver produtos"}<ArrowRight size={16} /></Link>
    </div></section>
  }
  // A different product or cart item starts a fresh local session; no cart mutation.
  return <PersonalizerWorkspace key={`${product.id}:${cartItemId ?? "new"}`} product={product} cartItemId={cartItemId} />
}
