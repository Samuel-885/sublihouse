import { Image, Minus, Plus, Shapes, Sparkles, Type } from "lucide-react"
import type { Product } from "../../types/product"
import PersonalizationMethod from "./PersonalizationMethod"
import PersonalizerToolControls from "./PersonalizerToolControls"
import { personalizerToolLabels, type PersonalizerTool } from "./types"
import type { DesignStore } from "./editor/createDesignStore"
import type { PersonalizationElement } from "./editor/types"

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" })
const icons = { default: Sparkles, photo: Image, text: Type, element: Shapes }

export default function PersonalizerPanel({ product, quantity, onQuantityChange, activeTool, isEditor, onStart, onChangeMethod, selectedElement, store, onReplacePhoto, busy, available }: {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
  activeTool: PersonalizerTool
  isEditor: boolean
  onStart: () => void
  onChangeMethod: () => void
  selectedElement: PersonalizationElement | null
  store: DesignStore
  onReplacePhoto: () => void
  busy: boolean
  available: boolean
}) {
  const Icon = icons[activeTool]
  return <div className="pz-panel">
    <div className="pz-panel-title"><Icon size={16} /><h2>{personalizerToolLabels[activeTool]}</h2></div>
    {isEditor && <div className="pz-editor-controls">
      <p id="pz-tools-notice" className="pz-tools-notice">{available ? "Toca numa fotografia ou texto na peça para selecionar. Arrasta para mover." : "A edição 3D não está disponível nesta pré-visualização."}</p>
      {!selectedElement ? <p className="pz-guidance">Adiciona uma fotografia ou texto na barra abaixo da peça para começares a criar.</p> : <PersonalizerToolControls key={selectedElement.id} element={selectedElement} store={store} onReplacePhoto={onReplacePhoto} busy={busy} available={available} />}
    </div>}
    <section className="pz-purchase" aria-label="Produto e quantidade">
      <p className="pz-label">{product.category}</p><h3>{product.name}</h3>
      <div className="pz-purchase-row">
        <div><p className="pz-label">Preço por unidade</p><p className="pz-price">{currency.format(product.price)}</p></div>
        <div className="pz-quantity-group"><span className="pz-label" id="pz-quantity-label">Quantidade</span><div className="pz-quantity" role="group" aria-labelledby="pz-quantity-label">
          <button type="button" aria-label="Diminuir quantidade" disabled={quantity === 1} onClick={() => onQuantityChange(Math.max(1, quantity - 1))}><Minus size={13} /></button>
          <output aria-live="polite" aria-label="Quantidade">{quantity}</output>
          <button type="button" aria-label="Aumentar quantidade" onClick={() => onQuantityChange(quantity + 1)}><Plus size={13} /></button>
        </div></div>
      </div>
    </section>
    {!isEditor && <PersonalizationMethod productName={product.name} onStart={onStart} />}
    <div className="pz-purchase-actions">
      <button className="pz-button pz-button-primary" type="button" disabled aria-describedby="pz-cart-help">Adicionar ao carrinho</button>
      <button className="pz-button" type="button" disabled>Guardar design</button>
      <p id="pz-cart-help">Guardar e adicionar ao carrinho estarão disponíveis numa próxima fase.</p>
    </div>
    {isEditor && <button className="pz-change-method" type="button" onClick={onChangeMethod}>Preferes enviar a tua ideia? <span>Ver opções <span aria-hidden="true">→</span></span></button>}
  </div>
}
