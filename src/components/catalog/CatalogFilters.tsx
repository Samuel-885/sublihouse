type CatalogFiltersProps = {
  prefix: string
  categories: string[]
  category: string
  customization: string
  price: string
  onlySale: boolean
  onCategory: (value: string) => void
  onCustomization: (value: string) => void
  onPrice: (value: string) => void
  onSale: (value: boolean) => void
}

export default function CatalogFilters({
  prefix, categories, category, customization, price, onlySale,
  onCategory, onCustomization, onPrice, onSale,
}: CatalogFiltersProps) {
  return (
    <div className="catalog-filter-groups">
      <fieldset className="catalog-categories">
        <legend>Categoria</legend>
        {categories.map(value => (
          <label className="catalog-filter-option" key={value}>
            <input type="radio" name={`${prefix}-category`} value={value} checked={category === value} onChange={() => onCategory(value)} />
            <span>{value}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Personalização</legend>
        {["Todos", "Personalizável", "Não personalizável"].map(value => (
          <label className="catalog-filter-option" key={value}>
            <input type="radio" name={`${prefix}-customization`} value={value} checked={customization === value} onChange={() => onCustomization(value)} />
            <span>{value}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Promoções</legend>
        <label className="catalog-filter-option">
          <input type="checkbox" checked={onlySale} onChange={event => onSale(event.target.checked)} />
          <span>Em promoção</span>
        </label>
      </fieldset>
      <fieldset>
        <legend>Preço</legend>
        {["Todos", "Até €5", "€5 – €10", "€10 – €15", "Mais de €15"].map(value => (
          <label className="catalog-filter-option" key={value}>
            <input type="radio" name={`${prefix}-price`} value={value} checked={price === value} onChange={() => onPrice(value)} />
            <span>{value}</span>
          </label>
        ))}
      </fieldset>
    </div>
  )
}
