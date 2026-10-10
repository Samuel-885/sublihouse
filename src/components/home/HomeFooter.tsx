import { ArrowRight, MessageCircle } from "lucide-react"
import { Link } from "react-router"
import { createWhatsAppUrl } from "../../data/contact"
import { homeCategories } from "./homeData"

export default function HomeFooter() {
  return <footer id="contacto" className="sh-home sh-footer">
    <div className="sh-footer-cta"><div className="sh-container"><h2>Personaliza.<br />Surpreende.<br /><span className="sh-pink">Marca momentos.</span></h2><Link className="sh-button sh-button-light" to="/products?customizable=true">Criar a tua prenda <ArrowRight size={15} /></Link></div></div>
    <div className="sh-container sh-footer-grid">
      <div className="sh-footer-brand"><Link className="sh-wordmark" to="/" aria-label="Sublime House — página inicial">SUBLI<span>HOUSE</span></Link><p>Produtos personalizados e criativos, feitos com atenção a cada detalhe. Canecas, ímãs, camisetas e fotopresentes com a tua cara.</p><a className="sh-footer-contact" href={createWhatsAppUrl("Olá! Gostaria de saber mais sobre a Sublime House.")} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Fala connosco</a></div>
      <nav aria-label="Loja no rodapé"><h3>Loja</h3>{homeCategories.map(category => <Link to={category.to} key={category.name}>{category.name}</Link>)}</nav>
      <nav aria-label="Marca no rodapé"><h3>Marca</h3><Link to="/#sobre">Sobre</Link><Link to="/#personalizar">Personalizados</Link><a href={createWhatsAppUrl("Olá! Preciso de ajuda com uma encomenda.")} target="_blank" rel="noreferrer">Contacto</a><Link to="/#perguntas-frequentes">Ajuda / FAQ</Link></nav>
      <div className="sh-footer-help"><h3>Informações</h3><Link to="/#perguntas-frequentes">Produção e envios</Link><a href={createWhatsAppUrl("Olá! Gostaria de esclarecer as condições de troca ou devolução.")} target="_blank" rel="noreferrer">Trocas e devoluções</a><p>Para esclarecer as condições da tua encomenda, fala connosco.</p></div>
    </div>
    <div className="sh-footer-bottom"><div className="sh-container"><p>© {new Date().getFullYear()} Sublime House. Personaliza ideias, marca momentos.</p><span>Portugal</span></div></div>
  </footer>
}
