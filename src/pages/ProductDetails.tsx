import { useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowRight, Check, Heart, MessageCircle, Minus, Plus, SlidersHorizontal } from "lucide-react"
import { products } from "../data/products"
import { createWhatsAppUrl } from "../data/contact"
import { useCart } from "../context/useCart"
import ProductGallery from "../components/product/ProductGallery"
import CatalogProductCard from "../components/catalog/CatalogProductCard"
import "../components/catalog/catalog.css"
import "../components/product/product-details.css"

function ProductDetails() {
  const { id } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [addedCount, setAddedCount] = useState(0)
  const { addToCart } = useCart()
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("sublime-home-favorites") ?? "[]")
      return Array.isArray(saved) ? saved.filter((id): id is number => typeof id === "number") : []
    } catch {
      return []
    }
  })

  function toggleFavorite(id: number) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem("sublime-home-favorites", JSON.stringify(next))
    } catch { /* Match the catalogue: favorites remain usable without browser storage. */ }
  }

  const product = products.find(product => product.id === Number(id))

  if (!product) {
    return (
      <section id="home-conteudo" className="product-details" aria-labelledby="product-title" tabIndex={-1}>
        <div className="pd-container pd-not-found">
          <p className="pd-eyebrow">Loja</p>
          <h1 id="product-title">Produto não encontrado</h1>
          <Link to="/products" className="pd-text-link">Voltar aos produtos <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    )
  }

  const favorite = favorites.includes(product.id)
  const relatedProducts = products.filter(item => item.category === product.category && item.id !== product.id).slice(0, 2)

  return (
    <section id="home-conteudo" className="product-details" aria-labelledby="product-title" tabIndex={-1}>
      <div className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Navegação de localização">
          <ol>
            <li><Link to="/">Início</Link></li>
            <li><Link to="/products">Loja</Link></li>
            <li><Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="pd-layout">
          <ProductGallery product={product} />
          <div className="pd-info">
            <p className="pd-eyebrow">{product.category}</p>
            <h1 id="product-title">{product.name}</h1>
            <p className="pd-price">{product.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</p>
            <p className="pd-description">
              Uma prenda pensada para tornar momentos especiais ainda mais pessoais.
              {product.customizable && " Escolhe os detalhes e cria algo único para oferecer ou guardar."}
            </p>

            {product.customizable && (
              <div className="pd-personalization">
                <SlidersHorizontal size={19} aria-hidden="true" />
                <div>
                  <h2>Este produto é personalizável</h2>
                  <p>Adiciona fotografias, textos e detalhes e vê o resultado diretamente na peça antes de adicionares ao carrinho.</p>
                  <Link to="/#personalizar" className="pd-text-link">Ver como funciona <ArrowRight size={14} aria-hidden="true" /></Link>
                </div>
              </div>
            )}

            <div className="pd-purchase">
              <div className="pd-quantity-row">
                <div className="pd-quantity-group">
                  <span id="quantity-label">Quantidade</span>
                  <div className="pd-quantity" role="group" aria-labelledby="quantity-label" aria-describedby={product.customizable ? "quantity-help" : undefined}>
                    <button type="button" aria-label="Diminuir quantidade" disabled={quantity === 1} onClick={() => setQuantity(current => Math.max(1, current - 1))}>
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <output aria-live="polite" aria-atomic="true" aria-label="Quantidade selecionada">{quantity}</output>
                    <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(current => current + 1)}>
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="pd-favorite"
                  aria-label={`${favorite ? "Remover" : "Guardar"} ${product.name} ${favorite ? "dos" : "nos"} favoritos`}
                  aria-pressed={favorite}
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart size={20} strokeWidth={1.5} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              </div>
              {product.customizable && <p id="quantity-help" className="pd-quantity-help">Ao personalizar, escolhe a quantidade no editor.</p>}

              <div className="pd-actions">
                {product.customizable ? (
                  <Link to={`/personalize/${product.id}`} className="pd-button pd-button-primary">
                    <span>Personalizar este produto</span><ArrowRight size={19} aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="pd-button pd-button-primary"
                    onClick={() => {
                      addToCart(product, quantity)
                      setAddedCount(count => count + 1)
                    }}
                  >
                    <span>Adicionar ao carrinho</span><ArrowRight size={18} aria-hidden="true" />
                  </button>
                )}
              </div>

              {!product.customizable && addedCount > 0 && (
                <div key={addedCount} role="status" className="pd-cart-feedback">
                  <span><Check size={16} aria-hidden="true" /> Adicionado ao carrinho.</span>
                  <Link to="/cart" className="pd-text-link">Ver carrinho <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              )}
            </div>

            <div className="pd-support">
              <p>Produção cuidada em cada detalhe.</p>
              <Link to="/#perguntas-frequentes" className="pd-text-link">Produção e envios <ArrowRight size={14} aria-hidden="true" /></Link>
              <a href={createWhatsAppUrl(`Olá! Preciso de ajuda com o produto ${product.name}.`)} target="_blank" rel="noreferrer" className="pd-support-contact">
                <MessageCircle size={17} aria-hidden="true" /> Apoio à encomenda
              </a>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="pd-related" aria-labelledby="related-title">
            <div className="pd-related-heading">
              <h2 id="related-title">Também vais gostar.</h2>
              <Link to="/products" className="pd-text-link">Ver todos <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <div className="pd-related-grid">
              {relatedProducts.map(item => (
                <CatalogProductCard key={item.id} product={item} favorite={favorites.includes(item.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

export default ProductDetails
