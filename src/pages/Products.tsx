import { useCallback, useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { useSearchParams } from "react-router"
import { products } from "../data/products"
import Drawer from "../components/layout/Drawer"
import CatalogFilters from "../components/catalog/CatalogFilters"
import CatalogProductCard from "../components/catalog/CatalogProductCard"
import "../components/catalog/catalog.css"

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get("q") ?? ""
  const categoryParam = searchParams.get("category")?.trim()
  const selectedCategory = products.some(product => product.category === categoryParam) ? categoryParam! : "Todos"
  const selectedCustomization = searchParams.get("customizable") === "true"
    ? "Personalizável"
    : searchParams.get("customizable") === "false" ? "Não personalizável" : "Todos"
  const onlySale = searchParams.get("sale") === "true"
  const [selectedPrice, setSelectedPrice] = useState("Todos")
  const [sortOption, setSortOption] = useState("relevant")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const closeFilters = useCallback(() => setIsFiltersOpen(false), [])
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
    } catch { /* Keep favorites usable if browser storage is unavailable. */ }
  }

  function updateSearchParams(values: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => {
      if (value) nextParams.set(key, value)
      else nextParams.delete(key)
    })
    setSearchParams(nextParams, { replace: true })
  }

  function setSearchTerm(value: string) {
    updateSearchParams({ q: value })
  }

  function setSelectedCategory(value: string) {
    updateSearchParams({ category: value === "Todos" ? null : value })
  }

  function setOnlySale(value: boolean) {
    updateSearchParams({ sale: value ? "true" : null })
  }

  function setSelectedCustomization(value: string) {
    updateSearchParams({ customizable: value === "Todos" ? null : value === "Personalizável" ? "true" : "false" })
  }

  const categories = ["Todos", ...new Set(products.map(product => product.category))]
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLocaleLowerCase("pt-PT").includes(searchTerm.trim().toLocaleLowerCase("pt-PT"))
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
    const matchesCustomization = selectedCustomization === "Todos" ||
      (selectedCustomization === "Personalizável" && product.customizable) ||
      (selectedCustomization === "Não personalizável" && !product.customizable)
    const matchesSale = !onlySale || product.onSale
    const matchesPrice = selectedPrice === "Todos" ||
      (selectedPrice === "Até €5" && product.price <= 5) ||
      (selectedPrice === "€5 – €10" && product.price > 5 && product.price <= 10) ||
      (selectedPrice === "€10 – €15" && product.price > 10 && product.price <= 15) ||
      (selectedPrice === "Mais de €15" && product.price > 15)
    return matchesSearch && matchesCategory && matchesCustomization && matchesSale && matchesPrice
  })
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-low") return a.price - b.price
    if (sortOption === "price-high") return b.price - a.price
    if (sortOption === "name") return a.name.localeCompare(b.name, "pt-PT")
    return 0
  })

  const activeFiltersCount = (selectedCategory !== "Todos" ? 1 : 0) +
    (selectedCustomization !== "Todos" ? 1 : 0) + (onlySale ? 1 : 0) + (selectedPrice !== "Todos" ? 1 : 0)

  function clearFilters() {
    updateSearchParams({ category: null, sale: null, customizable: null })
    setSelectedPrice("Todos")
  }

  const filterProps = {
    categories, category: selectedCategory, customization: selectedCustomization,
    price: selectedPrice, onlySale, onCategory: setSelectedCategory,
    onCustomization: setSelectedCustomization, onPrice: setSelectedPrice, onSale: setOnlySale,
  }
  const activeFilters = [
    ...(selectedCategory !== "Todos" ? [{ label: selectedCategory, clear: () => setSelectedCategory("Todos") }] : []),
    ...(selectedCustomization !== "Todos" ? [{ label: selectedCustomization, clear: () => setSelectedCustomization("Todos") }] : []),
    ...(onlySale ? [{ label: "Em promoção", clear: () => setOnlySale(false) }] : []),
    ...(selectedPrice !== "Todos" ? [{ label: selectedPrice, clear: () => setSelectedPrice("Todos") }] : []),
  ]

  return (
    <section id="home-conteudo" className="catalog-page" aria-labelledby="catalog-title">
      <div className="catalog-container">
        <header className="catalog-heading">
          <div><p className="catalog-eyebrow">Loja</p><h1 id="catalog-title">Todos os produtos</h1></div>
          <p className="catalog-count" role="status" aria-live="polite">{filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}</p>
        </header>

        <div className="catalog-layout">
          <aside className="catalog-sidebar" aria-label="Filtros de produtos">
            <CatalogFilters prefix="desktop" {...filterProps} />
          </aside>
          <div className="catalog-results">
            <div className="catalog-toolbar">
              <div className="catalog-search">
                <Search size={17} aria-hidden="true" />
                <input type="search" aria-label="Procurar produtos no catálogo" placeholder="Procurar produtos…" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
              </div>
              <button type="button" onClick={() => setIsFiltersOpen(true)} aria-haspopup="dialog" aria-expanded={isFiltersOpen} className="catalog-filter-toggle">
                <SlidersHorizontal size={16} aria-hidden="true" /> Filtros {activeFiltersCount > 0 && <span>({activeFiltersCount})</span>}
              </button>
              <select aria-label="Ordenar produtos" value={sortOption} onChange={event => setSortOption(event.target.value)} className="catalog-sort">
                <option value="relevant">Destaque</option>
                <option value="price-low">Menor preço</option>
                <option value="price-high">Maior preço</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="catalog-active-filters" aria-label="Filtros ativos">
                {activeFilters.map(filter => (
                  <button type="button" key={filter.label} onClick={filter.clear} aria-label={`Remover filtro: ${filter.label}`}>
                    {filter.label}<X size={13} aria-hidden="true" />
                  </button>
                ))}
                <button type="button" className="catalog-clear" onClick={clearFilters}>Limpar filtros</button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="catalog-empty">
                <h2>Nenhum produto encontrado</h2>
                <p>Experimenta alterar os filtros ou a pesquisa.</p>
              </div>
            ) : (
              <div className="catalog-grid">
                {sortedProducts.map(product => (
                  <CatalogProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer open={isFiltersOpen} onClose={closeFilters} title="Filtros">
        <div className="catalog-drawer-content">
          {activeFiltersCount > 0 && <button type="button" className="catalog-clear" onClick={clearFilters}>Limpar todos</button>}
          <CatalogFilters prefix="mobile" {...filterProps} />
          <div className="catalog-drawer-apply">
            <button type="button" onClick={closeFilters}>Ver {sortedProducts.length} {sortedProducts.length === 1 ? "produto" : "produtos"}</button>
          </div>
        </div>
      </Drawer>
    </section>
  )
}

export default Products
