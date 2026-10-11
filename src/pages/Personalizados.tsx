import { useState } from "react"
import { ArrowRight, ImagePlus, MousePointer2, PackageCheck, Palette, Plus, Minus } from "lucide-react"
import { Link } from "react-router"
import CatalogProductCard from "../components/catalog/CatalogProductCard"
import { products } from "../data/products"
import { createWhatsAppUrl } from "../data/contact"
import "../components/catalog/catalog.css"
import "./personalizados.css"

const catalogUrl = "/products?customizable=true"
const customizableProducts = products.filter(product => product.customizable === true)
const whatsappUrl = createWhatsAppUrl("Olá! Gostaria de saber mais sobre a personalização dos produtos da Sublime House.")

const moments = [
  { title: "Escolhe o produto", image: "/images/home/hero/hero-caneca.webp", alt: "Caneca branca com um padrão em rosa e azul" },
  { title: "Cria à tua maneira", image: "/images/home/categories/t-shirts.webp", alt: "T-shirt com uma estampa colorida" },
  { title: "Vê o resultado", image: "/images/home/hero/hero-imanes.webp", alt: "Ímanes personalizados com fotografias" },
]

const steps = [
  { title: "Escolhe o produto", description: "Caneca, t-shirt, íman, fotopresente — começa pela peça certa.", icon: MousePointer2 },
  { title: "Escolhe como criar", description: "Usa o editor visual ou envia a tua ideia pelo WhatsApp.", icon: ImagePlus },
  { title: "Personaliza", description: "Adiciona fotografias, textos e elementos e acompanha o resultado na peça.", icon: Palette },
  { title: "Finaliza", description: "Revê a tua criação, adiciona ao carrinho e segue com a encomenda.", icon: PackageCheck },
]

const questions = [
  { question: "Como funciona a personalização?", answer: "Começa por escolher um produto personalizável e consulta as opções na página da peça. O editor visual/3D fará parte desta experiência no futuro. Para esclarecer o que podes personalizar agora ou partilhar a tua ideia, fala connosco pelo WhatsApp." },
  { question: "Posso usar a minha própria fotografia?", answer: "Se queres criar uma peça com a tua fotografia, fala connosco pelo WhatsApp para confirmar a compatibilidade com o produto e os requisitos da imagem antes de encomendar." },
  { question: "Quanto tempo demora a produção?", answer: "O prazo depende do produto e dos detalhes da personalização. Contacta-nos pelo WhatsApp para confirmar o prazo da tua peça antes de encomendar." },
  { question: "Fazem envios para todo Portugal?", answer: "Fala connosco pelo WhatsApp para confirmar a disponibilidade, os custos e o prazo de envio para a tua morada." },
  { question: "Qual a qualidade da estampa?", answer: "O resultado depende da peça, do material e da imagem escolhida. Contacta-nos para conhecer as opções do produto e esclarecer os cuidados a ter com a tua fotografia." },
]

export default function Personalizados() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)
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
    } catch { /* Favorites remain usable when storage is unavailable. */ }
  }

  return (
    <div id="home-conteudo" className="sh-home personalized-page" tabIndex={-1}>
      <section className="personalized-hero" aria-labelledby="personalized-title">
        <div className="sh-container personalized-hero-grid">
          <div className="personalized-hero-copy">
            <p className="sh-eyebrow">Personalizados</p>
            <h1 id="personalized-title">Cria uma<br />prenda que<br /><span className="sh-pink">só tua.</span></h1>
            <p className="personalized-intro">Não compres numa prateleira. Escolhe uma fotografia, escreve um nome ou cria algo teu e acompanha o resultado diretamente na peça.</p>
            <div className="sh-actions">
              <Link className="sh-button sh-button-light" to={catalogUrl}>Começar <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className="sh-button personalized-outline" to="#como-funciona">Como funciona</Link>
            </div>
          </div>
          <figure className="personalized-hero-photo">
            <img src="/images/home/hero/hero-caneca.webp" alt="Caneca personalizada com padrão abstrato rosa e azul, sobre uma base de pedra" width={1024} height={1024} fetchPriority="high" />
            <figcaption>A tua ideia. A tua peça.</figcaption>
          </figure>
        </div>
      </section>

      <section className="personalized-experience" aria-labelledby="experience-title">
        <div className="sh-container">
          <div className="personalized-experience-heading">
            <p className="sh-eyebrow">Estúdio de personalização</p>
            <h2 id="experience-title">Vê a tua ideia a tomar forma.</h2>
            <p>Escolhe o produto, decide como queres personalizar e acompanha a tua criação antes de finalizar.</p>
          </div>
          <div className="personalized-moments">
            {moments.map((moment, index) => (
              <figure key={moment.title}>
                <img src={moment.image} alt={moment.alt} width={1024} height={1024} loading="lazy" />
                <figcaption>{index + 1}. {moment.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="sh-container personalized-how" aria-labelledby="how-title">
        <p className="sh-eyebrow">Como funciona</p>
        <h2 id="how-title">Quatro passos. Uma peça única.</h2>
        <ol className="personalized-steps">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title}>
              <div className="personalized-step-top"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /><span aria-hidden="true">0{index + 1}</span></div>
              <h3>{title}</h3><p>{description}</p>
            </li>
          ))}
        </ol>
        <p className="personalized-availability">O editor visual/3D fará parte desta experiência no futuro. Para já, consulta as opções de cada peça ou <a href={whatsappUrl} target="_blank" rel="noreferrer">fala connosco pelo WhatsApp <ArrowRight size={14} aria-hidden="true" /></a>.</p>
      </section>

      <section className="sh-container personalized-products" aria-labelledby="canvas-title">
        <div className="personalized-products-heading">
          <div><p className="sh-eyebrow">Produtos personalizáveis</p><h2 id="canvas-title">Escolhe o teu canvas.</h2></div>
          <Link className="sh-text-link" to={catalogUrl}>Ver todos <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="personalized-product-grid">
          {customizableProducts.map(product => <CatalogProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onToggleFavorite={toggleFavorite} />)}
        </div>
      </section>

      <section className="personalized-faq" aria-labelledby="personalized-faq-title">
        <div className="sh-container personalized-faq-grid">
          <div><p className="sh-eyebrow">Dúvidas</p><h2 id="personalized-faq-title">Personalização,<br /> sem mistérios.</h2></div>
          <div className="sh-faq-list">
            {questions.map((item, index) => (
              <div className="sh-faq-item" key={item.question}>
                <h3><button type="button" id={`personalized-question-${index}`} aria-expanded={openQuestion === index} aria-controls={`personalized-answer-${index}`} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}>
                  {item.question}{openQuestion === index ? <Minus size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                </button></h3>
                <div id={`personalized-answer-${index}`} role="region" aria-labelledby={`personalized-question-${index}`} className={`sh-faq-answer ${openQuestion === index ? "is-open" : ""}`} aria-hidden={openQuestion !== index} inert={openQuestion !== index}><div><p>{item.answer}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sh-container personalized-final" aria-labelledby="ready-title">
        <div><h2 id="ready-title">Pronto para criar?</h2><Link className="sh-button personalized-pink-button" to={catalogUrl}>Começar a personalizar <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </section>
    </div>
  )
}
