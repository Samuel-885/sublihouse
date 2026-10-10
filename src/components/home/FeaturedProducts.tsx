import { useState } from "react"
import { ArrowUpRight, Heart } from "lucide-react"
import { Link } from "react-router"
import { products } from "../../data/products"
import ProductImage from "../product/ProductImage"

export default function FeaturedProducts() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem("sublime-home-favorites") ?? "[]"); return Array.isArray(saved) ? saved.filter((id): id is number => typeof id === "number") : [] } catch { return [] }
  })
  function toggleFavorite(id: number) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]
    setFavorites(next)
    try { localStorage.setItem("sublime-home-favorites", JSON.stringify(next)) } catch { /* Favorites remain usable without browser storage. */ }
  }
  return (
    <section id="produtos" className="sh-section sh-featured" aria-labelledby="featured-title"><div className="sh-container">
      <div className="sh-section-heading"><div><p className="sh-eyebrow">02 — Destaques</p><h2 id="featured-title">Os mais queridos.</h2></div><Link className="sh-text-link" to="/products">Ver todos <ArrowUpRight size={14} /></Link></div>
      <div className="sh-product-grid">{products.slice(0, 4).map(product => <article className="sh-product" key={product.id}>
        <div className={`sh-product-photo sh-scene sh-product-${product.id}`}>
          <Link to={`/products/${product.id}`} aria-label={`Ver ${product.name}`}><ProductImage product={product} /></Link>
          {product.badge && <span className={`sh-badge ${product.badge === "Novo" ? "sh-badge-blue" : ""}`}>{product.badge}</span>}
          <button type="button" className="sh-favorite" aria-label={`${favorites.includes(product.id) ? "Remover" : "Guardar"} ${product.name} ${favorites.includes(product.id) ? "dos" : "nos"} favoritos`} aria-pressed={favorites.includes(product.id)} onClick={() => toggleFavorite(product.id)}><Heart size={17} fill={favorites.includes(product.id) ? "currentColor" : "none"} /></button>
        </div>
        <Link className="sh-product-info" to={`/products/${product.id}`}><h3>{product.name}</h3><strong>{product.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</strong><span>{product.customizable ? "Personalizável" : product.category}</span></Link>
      </article>)}</div>
    </div></section>
  )
}
