import { Link } from "react-router"
import type { Product } from "../../types/product"
import ProductImage from "./ProductImage"

type ProductCardProps = Pick<Product, "id" | "name" | "price" | "color" | "badge" | "image" | "imageAlt">

function ProductCard(product: ProductCardProps) {
  const { id, name, price, color, badge } = product
  return (
    <article className="product-card group min-w-0">
      <Link
        to={`/products/${id}`}
        className="block"
      >
        {/* Área da imagem */}
        <div className="relative aspect-square overflow-hidden rounded-xl border border-line/60 bg-paper">
          {/* Badge */}
          {badge && (
            <span className="absolute left-3 top-3 z-20 bg-paper px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          )}

          {/* Accent colorido */}
          <div
            className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 transition duration-300 group-hover:scale-110"
            style={{ backgroundColor: color }}
          />

          {/* Imagem principal com fallback local */}
          <div className="absolute inset-2 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-2">
            <ProductImage product={product} />
          </div>
        </div>

        {/* Informações */}
        <div className="pt-4">
          <h3 className="font-medium leading-6 text-ink transition group-hover:text-pink">
            {name}
          </h3>

          <p className="mt-1 font-semibold text-ink">
            {price.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard
