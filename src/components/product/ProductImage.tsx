import { useState } from "react"
import type { Product } from "../../types/product"
import ProductArtwork from "./ProductArtwork"

type ProductImageProps = {
  product: Pick<Product, "id" | "name" | "color" | "image" | "imageAlt">
  className?: string
  loading?: "lazy" | "eager"
}

function ProductImage({ product, className = "", loading = "lazy" }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const source = product.image?.trim()
  const alt = product.imageAlt?.trim() || product.name

  // Uma URL nova pode voltar a carregar, mesmo depois de outra imagem falhar.
  if (source && source !== failedSource) {
    return (
      <img
        key={source}
        src={source}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => setFailedSource(source)}
        className={`block h-full w-full object-contain ${className}`}
      />
    )
  }

  return (
    <span role="img" aria-label={`Ilustração de ${product.name}`} className={`block h-full w-full ${className}`}>
      <ProductArtwork productId={product.id} color={product.color} className="h-full w-full" />
    </span>
  )
}

export default ProductImage
