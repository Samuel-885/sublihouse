import { useState } from "react"
import { Link, useParams } from "react-router"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { products } from "../data/products"
import { useCart } from "../context/useCart"
import ProductImage from "../components/product/ProductImage"

function ProductDetails() {
  const { id } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [addedCount, setAddedCount] = useState(0)
  const { addToCart } = useCart()

  const product = products.find(
    (product) => product.id === Number(id)
  )

  if (!product) {
    return (
      <section className="mx-auto max-w-360 px-4 py-20 sm:px-6 lg:px-18">
        <h1 className="font-display text-3xl font-semibold">
          Produto não encontrado
        </h1>

        <Link
          to="/products"
          className="mt-6 inline-block font-semibold underline underline-offset-4"
        >
          Voltar aos produtos
        </Link>
      </section>
    )
  }

  function decreaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    )
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) => currentQuantity + 1)
  }

  return (
    <section className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-18 lg:py-14">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
        <Link to="/" className="hover:text-ink">
          Início
        </Link>

        <span>/</span>

        <Link to="/products" className="hover:text-ink">
          Produtos
        </Link>

        <span>/</span>

        <span className="text-ink">
          {product.name}
        </span>
      </div>

      {/* Produto */}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr] lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {/* Imagem principal; a galeria será adicionada quando houver fotografias. */}
        <div className="min-w-0">
          {/* Imagem principal */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-mist">
            {product.badge && (
              <span className="absolute left-4 top-4 z-20 bg-paper px-3 py-1.5 text-xs font-semibold">
                {product.badge}
              </span>
            )}

            <div
              className="absolute left-1/2 top-1/2 h-[48%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
              style={{ backgroundColor: product.color }}
            />

            <div className="absolute inset-4 flex items-center justify-center">
              <ProductImage product={product} loading="eager" />
            </div>
          </div>

        </div>

        {/* Informações */}
        <div className="min-w-0 lg:pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-pink">
            {product.category}
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-4xl xl:text-5xl">
            {product.name}
          </h1>

          <p className="mt-5 text-2xl font-semibold">
            {product.price.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </p>

          <p className="mt-6 max-w-xl leading-7 text-slate">
            Uma prenda pensada para tornar momentos especiais ainda mais
            pessoais. Escolhe os detalhes e cria algo único para oferecer ou
            guardar.
          </p>

          {/* Personalização */}
          {product.customizable && (
            <div className="mt-8 border-y border-line py-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-pink" />

                <div>
                  <h2 className="font-semibold">
                    Este produto é personalizável
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate">
                    Podes adicionar os teus próprios detalhes antes de
                    finalizar a encomenda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantidade */}
          {!product.customizable && (
            <div className="mt-8">
              <p className="text-sm font-semibold">
                Quantidade
              </p>

              <div className="mt-3 inline-flex items-center border border-line">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity === 1}
                  aria-label="Diminuir quantidade"
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-mist"
                >
                  <Minus size={16} />
                </button>

                <span className="flex h-11 min-w-12 items-center justify-center border-x border-line text-sm font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  aria-label="Aumentar quantidade"
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-mist"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="mt-8 space-y-3">
            {!product.customizable && (
              <button
                type="button"
                onClick={() => {
                  addToCart(product, quantity)
                  setAddedCount((count) => count + 1)
                }}
                className="flex w-full items-center justify-center gap-2 bg-ink px-5 py-4 text-sm font-bold text-paper transition hover:opacity-85"
              >
                <ShoppingCart size={18} />
                Adicionar ao carrinho
              </button>
            )}

            {addedCount > 0 && !product.customizable && (
              <div key={addedCount} role="status" className="feedback-enter rounded-lg border border-teal/30 bg-teal/5 p-4 text-sm">
                <p>Adicionado ao carrinho.</p>
                <Link to="/cart" className="mt-1 inline-block font-semibold underline underline-offset-4">Ver carrinho →</Link>
              </div>
            )}

            {product.customizable && (
              <Link
                to={`/personalize/${product.id}`}
                className="block w-full bg-ink px-5 py-4 text-center text-sm font-bold text-paper transition hover:opacity-85"
              >
                Personalizar este produto
              </Link>
            )}
          </div>

          {/* Informações rápidas */}
          <div className="mt-8 space-y-3 border-t border-line pt-6 text-sm text-slate">
            <p>Produção cuidada em cada detalhe.</p>
            <p>Catálogo de demonstração para Portugal.</p>
            <p>Sem pagamentos ou envios nesta versão de portfólio.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductDetails
