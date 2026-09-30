import ProductCard from "../product/ProductCard"
import { products } from "../../data/products"



function FeaturedProducts() {
const featuredProducts = products.slice(0, 4)
  return (
    <section
      id="produtos"
      className="bg-paper py-10 sm:py-12 lg:py-16"
    >
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-18">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-pink">
              DESTAQUES
            </p>

            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Os mais queridos
            </h2>
          </div>

          <a
            href="#"
            className="hidden text-sm font-semibold text-slate transition-colors hover:text-pink sm:block"
          >
            Ver todos →
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              color={product.color}
              badge={product.badge}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts