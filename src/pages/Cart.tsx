import { useState } from "react"
import { Link } from "react-router"
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "../context/useCart"
import ProductImage from "../components/product/ProductImage"
import "./cart.css"

const currency = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
})

function Cart() {
  const [showCheckoutDemo, setShowCheckoutDemo] = useState(false)
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <section id="home-conteudo" tabIndex={-1} className="cart-page cart-empty" aria-labelledby="cart-title">
        <div className="cart-container">
          <ShoppingBag className="cart-empty-icon" size={32} strokeWidth={1} aria-hidden="true" />
          <h1 id="cart-title">O teu carrinho está vazio.</h1>
          <p>Ainda não adicionaste nenhuma prenda. Vamos mudar isso.</p>
          <Link to="/products" className="cart-button">
            Ver produtos <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section id="home-conteudo" tabIndex={-1} className="cart-page" aria-labelledby="cart-title">
      <div className="cart-container">
        <h1 id="cart-title">Carrinho.</h1>
        <div className="cart-layout">
          <div className="cart-items" aria-label="Itens do carrinho">
            {cartItems.map((item) => (
              <article key={item.cartItemId} className="cart-item" aria-label={item.name}>
                <Link to={`/products/${item.id}`} className="cart-item-image" tabIndex={-1} aria-hidden="true">
                  <ProductImage product={item.customization && "design" in item.customization && item.customization.preview
                    ? { ...item, image: item.customization.preview, imageAlt: `Personalização de ${item.name}` }
                    : item} />
                </Link>
                <div className="cart-item-details">
                  <div className="cart-item-heading">
                    <div>
                      <h2><Link to={`/products/${item.id}`}>{item.name}</Link></h2>
                      {item.category && <p className="cart-item-category">{item.category}</p>}
                    </div>
                    <button
                      type="button"
                      className="cart-remove"
                      aria-label={`Remover ${item.name}`}
                      onClick={() => removeFromCart(item.cartItemId)}
                    >
                      Remover
                    </button>
                  </div>
                  {item.customization && (
                    <div className="cart-customization">
                      <p className="cart-customization-status">Personalizado</p>
                      <dl>
                        {"design" in item.customization ? <>
                          <div><dt>Variante:</dt><dd>{item.customization.variant.label}</dd></div>
                          {item.customization.design.texts.some(text => text.trim()) && (
                            <div><dt>Texto:</dt><dd>{item.customization.design.texts.join(" · ").slice(0, 120)}{item.customization.design.texts.join(" · ").length > 120 ? "…" : ""}</dd></div>
                          )}
                        </> : item.customization.name && (
                          <div><dt>Texto:</dt><dd>{item.customization.name.slice(0, 120)}</dd></div>
                        )}
                      </dl>
                    </div>
                  )}
                  <div className="cart-item-bottom">
                    <div className="cart-quantity" role="group" aria-label={`Quantidade de ${item.name}`}>
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        disabled={item.quantity === 1}
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      >
                        <Minus size={15} aria-hidden="true" />
                      </button>
                      <output aria-label={`Quantidade de ${item.name}`}>{item.quantity}</output>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      >
                        <Plus size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="cart-item-price">
                      <p aria-label="Total do item">{currency.format(item.price * item.quantity)}</p>
                      {item.quantity > 1 && <span>{currency.format(item.price)} / un.</span>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumo</h2>
            <dl className="cart-summary-lines">
              <div><dt>Subtotal</dt><dd>{currency.format(cartTotal)}</dd></div>
              <div className="cart-shipping"><dt>Envio</dt><dd>Calculado na finalização</dd></div>
              <div className="cart-total" aria-live="polite" aria-atomic="true">
                <dt>Total</dt><dd>{currency.format(cartTotal)}</dd>
              </div>
            </dl>
            <p className="cart-demo-note">
              Demonstração de portfólio. Não são processados pagamentos nem envios.
            </p>
            <button
              type="button"
              onClick={() => setShowCheckoutDemo(true)}
              aria-expanded={showCheckoutDemo}
              aria-controls={showCheckoutDemo ? "checkout-demo" : undefined}
              className="cart-button"
            >
              Finalizar encomenda <ArrowRight size={16} aria-hidden="true" />
            </button>
            {showCheckoutDemo && (
              <div id="checkout-demo" role="status" className="cart-demo-message">
                <p><strong>Chegaste ao fim da demonstração.</strong></p>
                <p>Nenhuma encomenda foi criada e nenhum pagamento foi efetuado. O teu carrinho mantém-se intacto.</p>
              </div>
            )}
            <Link to="/products" className="cart-continue">Continuar a comprar</Link>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Cart
