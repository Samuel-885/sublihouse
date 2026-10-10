import { ArrowUpRight, Shirt } from "lucide-react"
import { Link } from "react-router"
import { homeCategories } from "./homeData"

export default function Categories() {
  return (
    <section className="sh-container sh-section sh-categories" aria-labelledby="categories-title">
      <div className="sh-section-heading"><div><p className="sh-eyebrow">01 — Categorias</p><h2 id="categories-title">Encontra a tua prenda.</h2></div><Link className="sh-text-link" to="/products">Ver tudo <ArrowUpRight size={14} /></Link></div>
      <div className="sh-category-grid">{homeCategories.map((category, index) => <Link to={category.to} className={`sh-category-card sh-corners sh-scene sh-category-${index}`} key={category.name}>
        {category.image ? <img src={category.image} alt={category.name} loading="lazy" width={1024} height={1024} /> : <div className="sh-category-placeholder"><Shirt strokeWidth={0.8} aria-hidden="true" /><span>Fala connosco</span></div>}
        <div className="sh-category-caption"><h3>{category.name}</h3><p>{category.description}</p></div>
      </Link>)}</div>
    </section>
  )
}
