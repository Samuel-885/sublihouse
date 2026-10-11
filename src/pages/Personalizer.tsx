import { useRef, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Link, useParams, useSearchParams } from "react-router"
import { products } from "../data/products"
import type { Product } from "../types/product"
import PersonalizerViewer from "../components/personalizer/PersonalizerViewer"
import PersonalizerToolbar from "../components/personalizer/PersonalizerToolbar"
import PersonalizerPanel from "../components/personalizer/PersonalizerPanel"
import PersonalizerBottomSheet from "../components/personalizer/PersonalizerBottomSheet"
import type { PersonalizerTool } from "../components/personalizer/types"
import "../components/personalizer/personalizer.css"

function PersonalizerWorkspace({ product, cartItemId }: { product: Product; cartItemId: string | null }) {
  const [activeTool, setActiveTool] = useState<PersonalizerTool>("default")
  const [isEditor, setIsEditor] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const isEditingExistingItem = Boolean(cartItemId)

  function revealWorkspace() {
    // Position after the compact mobile viewer has laid out.
    requestAnimationFrame(() => {
      workspaceRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      })
    })
  }

  function startCreating(tool: PersonalizerTool = "default") {
    setIsEditor(true)
    setActiveTool(tool)
    setIsExpanded(true)
    revealWorkspace()
    if (tool === "default") {
      requestAnimationFrame(() => workspaceRef.current?.querySelector<HTMLButtonElement>(".pz-tool")?.focus({ preventScroll: true }))
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
            <PersonalizerViewer product={product} />
            <PersonalizerToolbar activeTool={activeTool} onSelect={startCreating} />
          </div>
          <PersonalizerBottomSheet key={`${activeTool}:${isEditor}`} activeTool={activeTool} expanded={isExpanded} onToggle={() => {
            setIsExpanded(!isExpanded)
            if (!isExpanded && isEditor) revealWorkspace()
          }}>
            <PersonalizerPanel product={product} quantity={quantity} onQuantityChange={setQuantity} activeTool={activeTool} isEditor={isEditor} onStart={() => startCreating()} onChangeMethod={() => {
              setIsEditor(false)
              setActiveTool("default")
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
