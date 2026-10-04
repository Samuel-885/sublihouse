import { useCallback, useState } from "react"
import { useSearchParams } from "react-router"
import ProductCard from "../components/product/ProductCard"
import { products } from "../data/products"
import Drawer from "../components/layout/Drawer"

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get("q") ?? ""
  const categoryParam = searchParams.get("category")?.trim()
  const selectedCategory = products.some((product) => product.category === categoryParam)
    ? categoryParam!
    : "Todos"
  const selectedCustomization = searchParams.get("customizable") === "true"
    ? "Personalizável"
    : searchParams.get("customizable") === "false" ? "Não personalizável" : "Todos"
  const onlySale = searchParams.get("sale") === "true"
  const [selectedPrice, setSelectedPrice] = useState("Todos")
  const [sortOption, setSortOption] = useState("relevant")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const closeFilters = useCallback(() => setIsFiltersOpen(false), [])

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

  // Pega as categorias dos próprios produtos e remove duplicados
  const categories = [
    "Todos",
    ...new Set(products.map((product) => product.category)),
  ]

  // Produtos que passam por TODOS os filtros ativos
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLocaleLowerCase("pt-PT")
      .includes(searchTerm.trim().toLocaleLowerCase("pt-PT"))

    const matchesCategory =
      selectedCategory === "Todos" ||
      product.category === selectedCategory

    const matchesCustomization =
      selectedCustomization === "Todos" ||
      (selectedCustomization === "Personalizável" && product.customizable) ||
      (selectedCustomization === "Não personalizável" && !product.customizable)

    const matchesSale =
      !onlySale || product.onSale


    const matchesPrice =
      selectedPrice === "Todos" ||
      (selectedPrice === "Até €5" && product.price <= 5) ||
      (selectedPrice === "€5 – €10" &&
        product.price > 5 &&
        product.price <= 10) ||
      (selectedPrice === "€10 – €15" &&
        product.price > 10 &&
        product.price <= 15) ||
      (selectedPrice === "Mais de €15" && product.price > 15)
    return (
      matchesSearch &&
      matchesCategory &&
      matchesCustomization &&
      matchesSale &&
      matchesPrice
    )
  })
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-low") {
      return a.price - b.price
    }

    if (sortOption === "price-high") {
      return b.price - a.price
    }

    if (sortOption === "name") {
      return a.name.localeCompare(b.name, "pt-PT")
    }

    return 0
  })


  const activeFiltersCount =
    (selectedCategory !== "Todos" ? 1 : 0) +
    (selectedCustomization !== "Todos" ? 1 : 0) +
    (onlySale ? 1 : 0) +
    (selectedPrice !== "Todos" ? 1 : 0)
  function clearFilters() {
    updateSearchParams({ category: null, sale: null, customizable: null })
    setSelectedPrice("Todos")
  }
  return (
    <section className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-18 lg:py-14">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm text-slate">
          Início / Produtos
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-pink">
              Encontra a tua prenda
            </p>

            <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
              Produtos
            </h1>

            <p className="mt-3 max-w-lg leading-6 text-slate">
              Presentes personalizados para pessoas, momentos e ideias diferentes.
            </p>
          </div>

          <p className="text-sm font-medium text-slate">
            {filteredProducts.length} produtos
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="mt-8">
        <input
          type="search"
          aria-label="Procurar produtos no catálogo"
          placeholder="Procurar produtos..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full border border-line bg-paper px-4 py-3.5 text-sm outline-none transition placeholder:text-slate focus:border-ink"        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {/* Botão de filtros - mobile/tablet */}
        <button
          type="button"
          onClick={() => setIsFiltersOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isFiltersOpen}
          className="rounded-lg border border-ink px-4 py-2 text-sm font-semibold lg:hidden"
        >
          Filtros
          {activeFiltersCount > 0 && ` ${activeFiltersCount}`}
        </button>

        {/* Ordenação */}
        <select
          aria-label="Ordenar produtos"
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value)}
          className="ml-auto border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"        >
          <option value="relevant">
            Mais relevantes
          </option>

          <option value="price-low">
            Menor preço
          </option>

          <option value="price-high">
            Maior preço
          </option>

          <option value="name">
            Nome A-Z
          </option>
        </select>
      </div>
      {activeFiltersCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedCategory !== "Todos" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("Todos")}
              className="border border-line bg-paper px-3 py-1.5 text-xs font-medium transition hover:border-ink"
            >
              {selectedCategory} ×
            </button>
          )}

          {selectedCustomization !== "Todos" && (
            <button
              type="button"
              onClick={() => setSelectedCustomization("Todos")}
              className="border border-line bg-paper px-3 py-1.5 text-xs font-medium transition hover:border-ink"
            >
              {selectedCustomization} ×
            </button>
          )}

          {onlySale && (
            <button
              type="button"
              onClick={() => setOnlySale(false)}
              className="border border-line bg-paper px-3 py-1.5 text-xs font-medium transition hover:border-ink"
            >
              Em promoção ×
            </button>
          )}

          {selectedPrice !== "Todos" && (
            <button
              type="button"
              onClick={() => setSelectedPrice("Todos")}
              className="border border-line bg-paper px-3 py-1.5 text-xs font-medium transition hover:border-ink"
            >
              {selectedPrice} ×
            </button>
          )}

          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 text-xs font-semibold underline underline-offset-4"
          >
            Limpar filtros
          </button>
        </div>
      )}
      {/* Área do catálogo */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filtros desktop */}
        <aside className="hidden lg:block">
        <div>
          <div className="h-1 w-9 rounded-full bg-blue" />

          <h2 className="mt-3 font-semibold">
            Categoria
          </h2>
        </div>

          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <label
                key={category}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={selectedCategory === category}
                  onChange={() => setSelectedCategory(category)}
                />

                {category}
              </label>
            ))}
          </div>
          <div className="mt-8">
            <div className="h-1 w-9 rounded-full bg-pink" />

            <h2 className="mt-3 font-semibold">
              Personalização
            </h2>

            <div className="mt-4 space-y-3">
              {["Todos", "Personalizável", "Não personalizável"].map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="customization"
                    value={option}
                    checked={selectedCustomization === option}
                    onChange={() => setSelectedCustomization(option)}
                  />

                  {option}
                </label>
              ))}
            </div>
            <div className="mt-8">
              <div className="h-1 w-9 rounded-full bg-orange" />

              <h2 className="mt-3 font-semibold">
                Promoções
              </h2>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(event) => setOnlySale(event.target.checked)}
                />

                Em promoção
              </label>
            </div>
            <div className="mt-8">
              <div className="h-1 w-9 rounded-full bg-violet" />

              <h2 className="mt-3 font-semibold">
                Preço
              </h2>

              <div className="mt-4 space-y-3">
                {[
                  "Todos",
                  "Até €5",
                  "€5 – €10",
                  "€10 – €15",
                  "Mais de €15",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="price"
                      value={option}
                      checked={selectedPrice === option}
                      onChange={() => setSelectedPrice(option)}
                    />

                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>          
        </aside>

        {/* Produtos */}
        <div>
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="font-display text-2xl font-semibold">
                Nenhum produto encontrado
              </h2>

              <p className="mt-2 text-sm text-slate">
                Experimenta alterar os filtros ou a pesquisa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  color={product.color}
                  badge={product.badge}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Drawer open={isFiltersOpen} onClose={closeFilters} title="Filtros">
          <div className="filter-panel px-6 pb-6">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm font-semibold underline underline-offset-4"
              >
                Limpar todos
              </button>
            )}

            {/* Categoria */}
            <div className="mt-8">
              <h3 className="font-semibold">
                Categoria
              </h3>

              <div className="mt-4 space-y-3">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="mobile-category"
                      checked={selectedCategory === category}
                      onChange={() => setSelectedCategory(category)}
                    />

                    {category}
                  </label>
                ))}
              </div>
            </div>

            {/* Personalização */}
            <div className="mt-8">
              <h3 className="font-semibold">
                Personalização
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  "Todos",
                  "Personalizável",
                  "Não personalizável",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="mobile-customization"
                      checked={selectedCustomization === option}
                      onChange={() => setSelectedCustomization(option)}
                    />

                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Promoções */}
            <div className="mt-8">
              <h3 className="font-semibold">
                Promoções
              </h3>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(event) => setOnlySale(event.target.checked)}
                />

                Em promoção
              </label>
            </div>

            {/* Preço */}
            <div className="mt-8">
              <h3 className="font-semibold">
                Preço
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  "Todos",
                  "Até €5",
                  "€5 – €10",
                  "€10 – €15",
                  "Mais de €15",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="mobile-price"
                      checked={selectedPrice === option}
                      onChange={() => setSelectedPrice(option)}
                    />

                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Aplicar */}
            <button
              type="button"
              onClick={closeFilters}
              className="action-button sticky bottom-0 mt-10 w-full rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-paper shadow-lg"
            >
              Ver {sortedProducts.length} produtos
            </button>
          </div>
      </Drawer>
    </section>
  )


}

export default Products
