import { useCallback, useState } from "react"
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react"
import { Link } from "react-router"
import { useCart } from "../../context/useCart"
import Drawer from "../layout/Drawer"
import HeaderSearch from "../layout/HeaderSearch"
import { homeNavigation } from "./homeData"

export default function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { totalItems } = useCart()
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeNavigation = () => { setMenuOpen(false); setSearchOpen(false) }

  return (
    <div className="sh-home sh-header-wrap">
      <a className="sh-skip" href="#home-conteudo">Saltar para o conteúdo</a>
      <div className="sh-topbar" aria-label="Feito para ti">
        <div><span>✦ Presentes para todo Portugal</span><span>✦ Personalização com a tua cara</span><span>✦ Prendas únicas</span><span>✦ Presentes que marcam momentos</span><span aria-hidden="true">✦ Personalização com a tua cara</span></div>
      </div>
      <header className="sh-header">
        <div className="sh-container sh-header-row">
          <button className="sh-icon sh-menu-toggle" type="button" aria-label="Abrir menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => { setMenuOpen(true); setSearchOpen(false) }}><Menu size={20} /></button>
          <Link className="sh-wordmark" to="/" aria-label="Sublime House — página inicial">SUBLI<span>HOUSE</span></Link>
          <nav className="sh-desktop-nav" aria-label="Navegação principal">{homeNavigation.map(item => <Link key={item.label} to={item.to}>{item.label}</Link>)}</nav>
          <div className="sh-header-actions">
            <button className="sh-icon" type="button" aria-label={searchOpen ? "Fechar busca" : "Abrir busca"} aria-expanded={searchOpen} aria-controls="home-busca" onClick={() => setSearchOpen(!searchOpen)}>{searchOpen ? <X size={19} /> : <Search size={19} />}</button>
            <Link className="sh-icon" to="/#produtos" aria-label="Ver os mais queridos"><Heart size={19} /></Link>
            <Link className="sh-icon sh-bag" to="/cart" aria-label={`Carrinho, ${totalItems} artigos`}><ShoppingBag size={19} />{totalItems > 0 && <span className="sh-cart-count">{totalItems}</span>}</Link>
          </div>
        </div>
        {searchOpen && <div id="home-busca" className="sh-container sh-search"><HeaderSearch autoFocus onNavigate={closeNavigation} /></div>}
      </header>
      <Drawer open={menuOpen} onClose={closeMenu} title="Sublime House" side="left">
        <nav className="sh-mobile-nav" aria-label="Navegação principal mobile">
          {homeNavigation.map(item => <Link key={item.label} to={item.to} onClick={closeNavigation}>{item.label}<span aria-hidden="true">↗</span></Link>)}
          <Link to="/products?sale=true" onClick={closeNavigation}>Promoções<span aria-hidden="true">↗</span></Link>
          <Link to="/cart" onClick={closeNavigation}>Carrinho ({totalItems})<ShoppingBag size={18} /></Link>
        </nav>
      </Drawer>
    </div>
  )
}
