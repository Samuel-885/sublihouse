import { useState } from "react"
import { Menu, Search, ShoppingCart, X } from "lucide-react"
import { Link, NavLink } from "react-router"
import { useCart } from "../../context/useCart"

const navigationItems = [
  {
    label: "Início",
    to: "/",
  },
  {
    label: "Criar a tua prenda",
    to: "/#personalizar",
  },
  {
    label: "Papelaria Personalizada",
    to: "/products",
  },
  {
    label: "Canecas Temáticas",
    to: "/products",
  },
  {
    label: "Canecas Mágicas",
    to: "/products",
  },
  {
    label: "Promoções",
    to: "/products",
  },
  {
    label: "Contacto",
    to: "/#contacto",
  },
]

function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { totalItems } = useCart()

  const handleMenuClick = () => {
    setIsMenuOpen((previousValue) => !previousValue)
    setIsSearchOpen(false)
    }

  const handleSearchClick = () => {
    setIsSearchOpen((previousValue) => !previousValue)
    setIsMenuOpen(false)
    }

  return (
    <header>
      {/* Faixa superior */}
      <div className="bg-ink text-paper">
        <div className="mx-auto flex min-h-9 max-w-360 items-center justify-center px-4 sm:justify-between sm:px-6 lg:px-18">
          <p className="text-xs font-semibold">
            Personaliza. Surpreende. Marca momentos.
          </p>

          <p className="hidden text-xs font-semibold text-yellow sm:block">
            Envio rápido para todo Portugal
          </p>
        </div>
      </div>

      {/* Área principal do header */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-360 items-center gap-3 px-4 py-3 sm:px-6 lg:gap-8 lg:px-18 lg:py-4">
          {/* Menu mobile */}
        <button
        type="button"
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMenuOpen}
        className="text-xl lg:hidden"
        onClick={handleMenuClick}
        >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

          {/* Logo temporária */}
          <Link
            to="/"
            className="font-display whitespace-nowrap text-xl font-semibold sm:text-2xl"
          >
            Sublime House
          </Link>

          {/* Busca desktop */}
          <div className="hidden flex-1 lg:block">
            <input
              type="search"
              placeholder="Procurar produtos..."
              className="w-full rounded-[10px] border border-line bg-mist px-4 py-3 text-sm outline-none placeholder:text-slate focus:border-ink"
            />
          </div>

          {/* Ações */}
          <div className="ml-auto flex items-center gap-3 whitespace-nowrap sm:gap-5">
            {/* Idioma */}
            <button
              type="button"
              className="hidden text-sm font-semibold sm:block"
            >
              PT
            </button>

            {/* Busca mobile */}
            <button
              type="button"
              aria-label={isSearchOpen ? "Fechar busca" : "Abrir busca"}
              aria-expanded={isSearchOpen}
              className="text-lg lg:hidden"
              onClick={handleSearchClick}
            >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Carrinho */}
            <Link
              to="/cart"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <ShoppingCart size={20} />

              <span className="hidden sm:inline">
                Carrinho
              </span>

              {totalItems > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1 text-xs text-paper">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Busca mobile aberta */}
        {isSearchOpen && (
          <div className="mx-auto max-w-360 px-4 pb-3 sm:px-6 lg:hidden">
            <input
              type="search"
              placeholder="Procurar produtos..."
              autoFocus
              className="w-full rounded-[10px] border border-line bg-mist px-4 py-3 text-sm outline-none placeholder:text-slate focus:border-ink"
            />
          </div>
        )}
      </div>
        {isMenuOpen && (
        <nav className="border-b border-line bg-paper lg:hidden">
            <ul className="mx-auto flex max-w-360 flex-col px-4 py-4 sm:px-6">
            {navigationItems.map((item) => (
                <li key={item.label}>
                <NavLink
                  to={item.to}
                  className="text-sm font-semibold transition-colors hover:text-pink"
                >
                  {item.label}
                </NavLink>
                </li>
            ))}
            </ul>
        </nav>
        )}


      {/* Navegação desktop */}
      <nav className="hidden border-b border-line bg-paper lg:block">
        <ul className="mx-auto flex max-w-360 items-center gap-7 px-18 py-3">
          {navigationItems.map((item) => (
              <li key={item.label}>
              <NavLink
                to={item.to}
                className="text-sm font-semibold transition-colors hover:text-pink"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Header