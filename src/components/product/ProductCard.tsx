import { Link } from "react-router"
import type { Product } from "../../types/product"
import ProductImage from "./ProductImage"

type ProductCardProps = Pick<Product, "id" | "name" | "price" | "color" | "badge" | "image" | "imageAlt">

function ProductCard(product: ProductCardProps) {
  const { id, name, price, badge } = product
  return (
    <article className="product-card group min-w-0">
      <Link
        to={`/products/${id}`}
        className="block"
      >
        {/* Área da imagem */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line/60 bg-[#f3efe7]">
          {/* Badge */}
          {badge && (
            <span className="absolute left-3 top-3 z-20 bg-paper px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          )}

          {/* Imagem principal com fallback local */}
          <div className="absolute inset-0 flex items-center justify-center p-0 [&>img]:object-cover [&>span]:p-[5%] min-[480px]:[&>span]:p-[6%] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-2">
            <ProductImage product={product} className="object-center" />
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
