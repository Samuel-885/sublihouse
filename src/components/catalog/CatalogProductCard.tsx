import { Heart } from "lucide-react"
import { Link } from "react-router"
import type { Product } from "../../types/product"
import ProductImage from "../product/ProductImage"

type CatalogProductCardProps = {
  product: Product
  favorite: boolean
  onToggleFavorite: (id: number) => void
}

export default function CatalogProductCard({ product, favorite, onToggleFavorite }: CatalogProductCardProps) {
  return (
    <article className="catalog-card" data-product-id={product.id}>
      <div className="catalog-card-photo">
        <Link to={`/products/${product.id}`} aria-label={`Ver ${product.name}`} className="catalog-card-image">
          <ProductImage product={product} />
        </Link>
        {product.badge && (
          <span className={`catalog-badge ${product.badge === "Novo" ? "catalog-badge-new" : ""}`}>
            {product.badge}
          </span>
        )}
        <button
          type="button"
          className="catalog-favorite"
          aria-label={`${favorite ? "Remover" : "Guardar"} ${product.name} ${favorite ? "dos" : "nos"} favoritos`}
          aria-pressed={favorite}
          onClick={() => onToggleFavorite(product.id)}
        >
          <Heart size={18} strokeWidth={1.5} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <Link to={`/products/${product.id}`} className="catalog-card-info">
        <h2>{product.name}</h2>
        <strong className="catalog-card-price">
          {product.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
        </strong>
        <span className="catalog-card-caption">{product.customizable ? "Personalizável" : product.category}</span>
      </Link>
    </article>
  )
}
