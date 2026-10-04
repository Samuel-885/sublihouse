import { Link } from "react-router"
import ProductArtwork from "./ProductArtwork"

type ProductCardProps = {
  id: number
  name: string
  price: number
  color: string
  badge?: string
  
}

function ProductCard({
  id,
  name,
  price,
  color,
  badge,
}: ProductCardProps) {
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

          {/* Placeholder do produto */}
          <div className="absolute inset-2 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-2">
            <ProductArtwork productId={id} color={color} className="h-full w-full" />
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
