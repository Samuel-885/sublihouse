import { useCallback, useState } from "react"
import { Menu, Search, ShoppingCart, X } from "lucide-react"
import { Link, useLocation } from "react-router"
import { useCart } from "../../context/useCart"
import Drawer from "./Drawer"
import HeaderSearch from "./HeaderSearch"
import TopBar from "./TopBar"
import { homeNavigation } from "../home/homeData"

const navigationItems = [
  { label: "Início", to: "/" },
  { label: "Criar a tua prenda", to: "/personalizados" },
  { label: "Papelaria Personalizada", to: "/products?category=Papelaria" },
  { label: "Canecas Temáticas", to: "/products?category=Canecas&q=Tem%C3%A1tica" },
  { label: "Canecas Mágicas", to: "/products?category=Canecas&q=M%C3%A1gica" },
  { label: "Promoções", to: "/products?sale=true" },
  { label: "Contacto", to: "/#contacto" },
]

function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const location = useLocation()
  const currentUrl = location.pathname + location.search + location.hash
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])
  const closeNavigation = useCallback(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [])

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-50 bg-paper shadow-[0_4px_20px_rgba(10,10,10,0.05)]">

        <div className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-360 items-center gap-1 px-3 py-3 sm:gap-3 sm:px-6 lg:gap-8 lg:px-18 lg:py-4">
            <button type="button" aria-label="Abrir menu" aria-haspopup="dialog" aria-expanded={isMenuOpen} className="icon-button shrink-0 lg:hidden" onClick={() => { setIsMenuOpen(true); setIsSearchOpen(false) }}>
              <Menu size={22} />
            </button>
            <Link to="/" aria-label="Sublime House - página inicial">
              <img
                src="/images/brand/sublihouse-logo.png"
                alt="Sublime House"
                className="h-12 w-auto object-contain sm:h-14"
              />
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block"><HeaderSearch onNavigate={closeNavigation} /></div>
            <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-3">
              <span className="hidden text-xs font-semibold text-slate sm:block">PT</span>
              <button type="button" aria-label={isSearchOpen ? "Fechar busca" : "Abrir busca"} aria-expanded={isSearchOpen} className="icon-button lg:hidden" onClick={() => setIsSearchOpen((value) => !value)}>
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
              <Link to="/cart" onClick={closeNavigation} aria-label={`Carrinho, ${totalItems} artigos`} className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors hover:bg-mist">
                <ShoppingCart size={20} /><span className="hidden sm:inline">Carrinho</span>
                {totalItems > 0 && <span key={totalItems} className="cart-count absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1 text-[11px] text-paper sm:static">{totalItems}</span>}
              </Link>
            </div>
          </div>
          {isSearchOpen && <div className="feedback-enter mx-auto max-w-360 px-4 pb-4 sm:px-6 lg:hidden"><HeaderSearch autoFocus onNavigate={closeNavigation} /></div>}
        </div>
        <Drawer open={isMenuOpen} onClose={closeMenu} title="Sublime House" heading={<img src="/images/brand/sublihouse-logo.png" alt="Sublime House" width={120} height={80} />} side="left">
          <div className="flex flex-1 flex-col px-6 pb-6">
            <nav aria-label="Navegação principal mobile" className="py-3">
              {[...homeNavigation, { label: "Promoções", to: "/products?sale=true" }].map(item => (
                <Link key={item.label} to={item.to} onClick={closeNavigation} aria-current={currentUrl === item.to ? "page" : undefined} className="drawer-link flex min-h-13 items-center border-b border-line px-3 py-3.5 text-sm font-semibold">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </Drawer>
        <nav aria-label="Navegação principal" className="hidden border-b border-line bg-paper lg:block">
          <ul className="mx-auto flex max-w-360 items-center justify-between gap-4 px-8 py-3 xl:px-18">
            {navigationItems.map((item) => <li key={item.label}><Link to={item.to} aria-current={currentUrl === item.to ? "page" : undefined} className="nav-link text-xs font-semibold xl:text-sm">{item.label}</Link></li>)}
          </ul>
        </nav>
      </header>
    </>
  )
}

export default Header
