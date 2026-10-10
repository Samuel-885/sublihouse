import type { Product } from "../../types/product"
import ProductImage from "./ProductImage"

type ProductGalleryProps = {
  product: Pick<Product, "id" | "name" | "image" | "imageAlt" | "color" | "badge" | "customizable">
}

// Media presentation is independent of purchasing. There is currently one image
// per product; a future media adapter can provide the gallery here.
export default function ProductGallery({ product }: ProductGalleryProps) {
  const badge = product.customizable ? "Personalizável" : product.badge

  return (
    <div className="pd-gallery" aria-label={`Imagem de ${product.name}`}>
      {badge && <span className={`pd-badge ${badge === "Novo" ? "pd-badge-new" : ""}`}>{badge}</span>}
      <div className="pd-gallery-image">
        <ProductImage product={product} loading="eager" />
      </div>
    </div>
  )
}
