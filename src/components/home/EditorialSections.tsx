import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Link } from "react-router"
import { createWhatsAppUrl } from "../../data/contact"

const orderSteps = [
  ["Escolhe", "Procura o produto certo para a ocasião."],
  ["Personaliza", "Foto, nome, cor e fonte — vê a prévia."],
  ["Aprova e compra", "Confirma a tua criação e adiciona ao carrinho."],
  ["Recebe", "Consulta os detalhes de produção e envio."],
]
const occasions = [
  { title: "Dia das Mães", description: "Um obrigado com a tua assinatura." },
  { title: "Namorados", description: "A vossa história, num detalhe só vosso." },
  { title: "Aniversário", description: "Uma prenda tão única como quem a recebe." },
  { title: "Infantil", description: "Pequenos presentes para grandes sorrisos." },
  { title: "Empresas", description: "A tua marca nos detalhes que ficam." },
  { title: "Datas especiais", description: "Há momentos que merecem ser guardados." },
]
const inspiration = [
  { image: "/images/products/caneca-personalizada.png", alt: "Canecas com mensagens", to: "/products/1" },
  { image: "/images/products/caderno-personalizado.png", alt: "Cadernos com nomes", to: "/products/6" },
  { image: "/images/products/iman-personalizado.png", alt: "Ímanes com fotografias", to: "/products/8" },
  { image: "/images/products/fotopresente.png", alt: "Fotopresentes em forma de coração", to: "/products/3" },
  { image: "/images/products/porta-chaves.png", alt: "Porta-chaves personalizados", to: "/products/4" },
  { image: "/images/hero/product-3.png", alt: "Fotografia numa peça de ardósia", to: "/products?category=Fotopresentes" },
]

export function HowItWorks() {
  return <section className="sh-container sh-section sh-how" aria-labelledby="how-title"><div className="sh-section-heading"><div><p className="sh-eyebrow">04 — Como funciona</p><h2 id="how-title">Da ideia à porta de casa.</h2></div></div><ol className="sh-order-steps">{orderSteps.map(([title, description], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>
}
export function Occasions() {
  return (
    <section id="colecoes" className="sh-occasions" aria-labelledby="occasions-title">
      <div className="sh-container sh-section">
        <div className="sh-section-heading">
          <div><p className="sh-eyebrow">05 — Coleções</p><h2 id="occasions-title">Para cada momento.</h2></div>
        </div>
        <div className="sh-occasion-grid">
          {occasions.map(({ title, description }, index) => (
            <a href={createWhatsAppUrl(`Olá! Procuro uma prenda para ${title}. Podem ajudar-me a escolher?`)} target="_blank" rel="noreferrer" key={title}>
              <span className="sh-occasion-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="sh-occasion-more">Ver coleção <ArrowRight size={14} aria-hidden="true" /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
export function Editorial() {
  return <section id="sobre" className="sh-container sh-section sh-editorial" aria-labelledby="editorial-title"><div className="sh-editorial-banner sh-corners"><img src="/images/personalization/caneca-base.png" alt="Detalhe de uma caneca personalizada num ambiente acolhedor" loading="lazy" width={1024} height={1024} /><div className="sh-editorial-copy"><p className="sh-eyebrow">Editorial</p><h2 id="editorial-title">Cada detalhe<br />conta uma<br className="sh-desktop-break" /> história.</h2><p>Fotografias, palavras e detalhes escolhidos por ti. Uma forma de dar significado ao que ofereces.</p><a className="sh-button sh-button-light" href="#contacto">Conhecer a marca <ArrowUpRight size={14} /></a></div></div></section>
}
export function Inspiration() {
  return <section className="sh-container sh-section sh-inspiration" aria-labelledby="inspiration-title"><div className="sh-section-heading"><div><p className="sh-eyebrow">08 — Inspiração</p><h2 id="inspiration-title">@sublimehouse</h2></div><Link className="sh-text-link" to="/products">Explorar <ArrowUpRight size={14} /></Link></div><div className="sh-inspiration-grid">{inspiration.map((item, index) => <Link className={`sh-scene sh-inspiration-${index}`} to={item.to} key={item.alt}><img src={item.image} alt={item.alt} loading="lazy" width={1024} height={1024} /></Link>)}</div></section>
}
