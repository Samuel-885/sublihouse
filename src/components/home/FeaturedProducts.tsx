import ProductCard from "../product/ProductCard"
import { products } from "../../data/products"
import { Link } from "react-router"



function FeaturedProducts() {
const featuredProducts = products.slice(0, 4)
  return (
    <section
      id="produtos"
      className="border-t border-blue/10 bg-blue/3 py-10 sm:py-12 lg:py-16"
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

          <Link
            to="/products"
            className="hidden text-sm font-semibold text-slate transition-colors hover:text-pink sm:block"
          >
            Ver todos →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              color={product.color}
              badge={product.badge}
              image={product.image}
              imageAlt={product.imageAlt}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts
