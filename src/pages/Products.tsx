import { useState } from "react"
import ProductCard from "../components/product/ProductCard"
import { products } from "../data/products"

function Products() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedCustomization, setSelectedCustomization] = useState("Todos")
  const [onlySale, setOnlySale] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState("Todos")
  const [sortOption, setSortOption] = useState("relevant")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Pega as categorias dos próprios produtos e remove duplicados
  const categories = [
    "Todos",
    ...new Set(products.map((product) => product.category)),
  ]

  // Produtos que passam por TODOS os filtros ativos
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLocaleLowerCase("pt-PT")
      .includes(searchTerm.toLocaleLowerCase("pt-PT"))

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
    setSelectedCategory("Todos")
    setSelectedCustomization("Todos")
    setOnlySale(false)
    setSelectedPrice("Todos")
  }
  return (
    <section className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-18 lg:py-14">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm text-slate">
          Início / Produtos
        </p>

        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Produtos
        </h1>

        <p className="mt-2 text-sm text-slate">
          {filteredProducts.length} produtos
        </p>
      </div>

      {/* Busca */}
      <div className="mt-6">
        <input
          type="search"
          placeholder="Procurar produtos..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm outline-none placeholder:text-slate focus:border-ink"
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {/* Botão de filtros - mobile/tablet */}
        <button
          type="button"
          onClick={() => setIsFiltersOpen(true)}
          className="rounded-lg border border-ink px-4 py-2 text-sm font-semibold lg:hidden"
        >
          Filtros
          {activeFiltersCount > 0 && ` ${activeFiltersCount}`}
        </button>

        {/* Ordenação */}
        <select
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value)}
          className="ml-auto rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
        >
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
              className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium"
            >
              {selectedCategory} ×
            </button>
          )}

          {selectedCustomization !== "Todos" && (
            <button
              type="button"
              onClick={() => setSelectedCustomization("Todos")}
              className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium"
            >
              {selectedCustomization} ×
            </button>
          )}

          {onlySale && (
            <button
              type="button"
              onClick={() => setOnlySale(false)}
              className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium"
            >
              Em promoção ×
            </button>
          )}

          {selectedPrice !== "Todos" && (
            <button
              type="button"
              onClick={() => setSelectedPrice("Todos")}
              className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium"
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
          <h2 className="font-semibold">
            Categoria
          </h2>

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
            <h2 className="font-semibold">
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
              <h2 className="font-semibold">
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
              <h2 className="font-semibold">
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
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

      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fundo escuro */}
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setIsFiltersOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />

          {/* Painel */}
          <aside className="absolute top-0 right-0 h-full w-[85%] max-w-sm overflow-y-auto bg-paper p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                Filtros
              </h2>

              <button
                type="button"
                aria-label="Fechar filtros"
                onClick={() => setIsFiltersOpen(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>
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
              onClick={() => setIsFiltersOpen(false)}
              className="mt-10 w-full rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper"
            >
              Ver {sortedProducts.length} produtos
            </button>
          </aside>
        </div>
      )}
    </section>
  )


}

export default Products