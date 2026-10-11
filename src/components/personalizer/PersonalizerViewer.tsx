import { RotateCcw } from "lucide-react"
import type { Product } from "../../types/product"
import ProductImage from "../product/ProductImage"

// A future scene can replace this product-only boundary without changing the
// toolbar, purchase state or responsive panel. No model is assumed.
export default function PersonalizerViewer({ product }: { product: Product }) {
  return <figure className="pz-viewer" aria-label={`Pré-visualização de ${product.name}`}>
    <div className="pz-viewer-surface">
      <span className="pz-viewer-label">Pré-visualização</span>
      <div className="pz-product-image"><ProductImage product={product} loading="eager" /></div>
    </div>
    <figcaption className="pz-viewer-caption"><span>Imagem do produto</span><button className="pz-button pz-reset" type="button" disabled><RotateCcw size={12} /> Repor vista</button></figcaption>
  </figure>
}
