import { useState } from "react"
import { Link } from "react-router"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart } from "../context/useCart"
import { getPersonalizationColorName } from "../data/personalizationColors"

function Cart() {
  const [showCheckoutDemo, setShowCheckoutDemo] = useState(false)
  const {
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart()

  if (cartItems.length === 0) {
    return (
      <section className="mx-auto max-w-360 px-4 py-20 text-center sm:px-6 lg:px-18">
        <p className="text-xs font-bold uppercase tracking-wider text-pink">
          O teu carrinho
        </p>

        <h1 className="mt-3 font-display text-4xl font-semibold">
          O carrinho está vazio.
        </h1>

        <p className="mx-auto mt-4 max-w-md leading-7 text-slate">
          Ainda não adicionaste nenhuma prenda. Explora os produtos e encontra
          algo especial.
        </p>

        <Link
          to="/products"
          className="mt-8 inline-flex bg-ink px-6 py-3 text-sm font-bold text-paper"
        >
          Ver produtos
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-18 lg:py-14">
      <p className="text-sm text-slate">
        Início / Carrinho
      </p>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-pink">
          A tua encomenda
        </p>

        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Carrinho
        </h1>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
        {/* Produtos */}
        <div className="border-t border-line">
          {cartItems.map((item) => (
            <article
              key={item.cartItemId}
              className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-line py-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-5"
            >
              {/* Imagem temporária */}
              <div className="aspect-square bg-mist">
                <div className="flex h-full items-center justify-center text-xs text-slate">
                  Produto
                </div>
              </div>

              {/* Informações */}
              <div className="min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/products/${item.id}`}
                      className="font-display text-xl font-semibold hover:text-pink"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-1 text-sm text-slate">
                      {item.category}
                    </p>

                    {item.customization && (
                      <div className="mt-3 space-y-1 text-sm text-slate">
                        {item.customization.name && (
                          <p>
                            Nome:{" "}
                            <span className="text-ink">
                              {item.customization.name}
                            </span>
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <span>Cor: {getPersonalizationColorName(item.customization.color)}</span>

                          <span
                            className="h-4 w-4 rounded-full border border-line"
                            style={{
                              backgroundColor: item.customization.color,
                            }}
                          />
                        </div>

                        <p>
                          Fonte:{" "}
                          <span className="text-ink">
                            {item.customization.font}
                          </span>
                        </p>

                        {item.customization.imageName && (
                          <p>
                            Foto:{" "}
                            <span className="break-all text-ink">
                              {item.customization.imageName}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="font-semibold">
                    {(item.price * item.quantity).toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                  {/* Quantidade */}
                  <div className="inline-flex items-center border border-line">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() =>
                        updateQuantity(
                          item.cartItemId,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity === 1}
                      className="flex h-10 w-10 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus size={15} />
                    </button>

                    <span className="flex h-10 min-w-11 items-center justify-center border-x border-line text-sm font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() =>
                        updateQuantity(
                          item.cartItemId,
                          item.quantity + 1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Remover */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="flex items-center gap-2 text-sm text-slate transition hover:text-pink"
                  >
                    <Trash2 size={16} />
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Resumo */}
        <aside className="h-fit bg-mist p-6 lg:sticky lg:top-6">
          <h2 className="font-display text-2xl font-semibold">
            Resumo
          </h2>

          <div className="mt-6 flex items-center justify-between border-b border-line pb-5 text-sm">
            <span className="text-slate">
              Subtotal
            </span>

            <span className="font-semibold">
              {cartTotal.toLocaleString("pt-PT", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-semibold">
              Total
            </span>

            <span className="text-xl font-bold">
              {cartTotal.toLocaleString("pt-PT", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate">
            Demonstração de portfólio. Não são processados pagamentos nem envios.
          </p>

          <button
            type="button"
            onClick={() => setShowCheckoutDemo(true)}
            aria-expanded={showCheckoutDemo}
            aria-controls="checkout-demo"
            className="mt-6 w-full bg-ink px-5 py-4 text-sm font-bold text-paper transition hover:opacity-85"
          >
            Finalizar compra
          </button>

          {showCheckoutDemo && (
            <div id="checkout-demo" role="status" className="mt-4 border border-line bg-paper p-4 text-sm leading-6">
              <p className="font-semibold">Chegaste ao fim da demonstração.</p>
              <p className="mt-2 text-slate">
                O checkout real será integrado via Shopify. Nenhuma encomenda foi
                criada e nenhum pagamento foi efetuado. O teu carrinho mantém-se intacto.
              </p>
            </div>
          )}

          <Link
            to="/products"
            className="mt-4 block text-center text-sm font-semibold underline underline-offset-4"
          >
            Continuar a comprar
          </Link>
        </aside>
      </div>
    </section>
  )
}

export default Cart
