import { ArrowRight, Plus } from "lucide-react"
import { Link } from "react-router"
import { homeCategories, homeHeroAssets } from "./homeData"

const stripCategories = [
  ...homeCategories,
  { name: "Personalizados", to: "/personalizados" },
  { name: "Presentes", to: "/products" },
]

export default function Hero({ assets = homeHeroAssets }: { assets?: typeof homeHeroAssets }) {
  return (
    <>
      <section id="home-conteudo" className="sh-container sh-hero" aria-labelledby="home-title">
        <div className="sh-hero-copy">
          <p className="sh-eyebrow sh-line-label">Creative print shop</p>
          <h1 id="home-title">Personalizados<br /><span className="sh-muted">com a </span><span className="sh-pink">tua</span><br />cara.</h1>
          <p className="sh-description">Fotografias, nomes e momentos transformados em prendas únicas. Criadas especialmente para quem importa.</p>
          <div className="sh-actions"><Link className="sh-button" to="/personalizados">Criar a tua prenda <Plus size={15} /></Link><Link className="sh-button sh-button-outline" to="/products">Ver produtos <ArrowRight size={15} /></Link></div>
          <div className="sh-hero-facts"><div><strong>À tua medida</strong><span>Personalização</span></div><div><strong>Com cuidado</strong><span>Cada detalhe</span></div><div><strong>Para ti</strong><span>Prendas únicas</span></div></div>
        </div>
        <div className="sh-hero-gallery">
          <Link to="/products/1" className="sh-hero-main sh-corners"><img src={assets.main.src} alt={assets.main.alt} fetchPriority="high" width={1024} height={1024} /><span className="sh-image-label">{assets.main.label}</span></Link>
          <Link to="/products?category=Papelaria" className="sh-hero-small sh-scene sh-scene-paper"><img src={assets.stationery.src} alt={assets.stationery.alt} width={1024} height={1024} /></Link>
          <Link to="/products/8" className="sh-hero-small sh-scene sh-scene-dark"><img src={assets.magnets.src} alt={assets.magnets.alt} width={1024} height={1024} /></Link>
          <span className="sh-hero-sticker" aria-hidden="true">Feito à medida</span>
        </div>
      </section>
      <nav className="sh-category-strip" aria-label="Atalhos de categorias">
        <div className="sh-marquee-track">
          {[0, 1].map(copy => (
            <div className="sh-marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {stripCategories.map(item => (
                <Link to={item.to} key={item.name} tabIndex={copy === 1 ? -1 : undefined}>
                  {item.name}<span aria-hidden="true">✦</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
