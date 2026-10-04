import { useId, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react"
import { Search, ArrowUpRight } from "lucide-react"
import { useNavigate } from "react-router"
import { products } from "../../data/products"
import ProductImage from "../product/ProductImage"

type HeaderSearchProps = {
  onNavigate: () => void
  autoFocus?: boolean
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ")

function HeaderSearch({ onNavigate, autoFocus = false }: HeaderSearchProps) {
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const navigate = useNavigate()
  const query = normalize(term)
  const suggestions = query
    ? products.filter((product) => product.name.toLocaleLowerCase("pt-PT").includes(query.toLocaleLowerCase("pt-PT"))).slice(0, 5)
    : []
  const expanded = open && query.length > 0

  function chooseProduct(id: number) {
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.blur()
    navigate(`/products/${id}`)
    onNavigate()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setTerm(query)
    setOpen(false)
    inputRef.current?.blur()
    navigate(query ? `/products?${new URLSearchParams({ q: query })}` : "/products")
    onNavigate()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => event.key === "ArrowDown"
        ? (current + 1) % suggestions.length
        : (current <= 0 ? suggestions.length : current) - 1)
    } else if (event.key === "Enter" && expanded && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault()
      chooseProduct(suggestions[activeIndex].id)
    }
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative min-w-0" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Procurar produtos"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          name="q"
          autoComplete="off"
          autoFocus={autoFocus}
          value={term}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setTerm(event.target.value)
            setActiveIndex(-1)
            setOpen(true)
          }}
          placeholder="Encontra a tua próxima prenda..."
          className="w-full rounded-[10px] border border-line bg-mist py-3 pr-12 pl-4 text-sm outline-none transition-colors placeholder:text-slate focus:border-ink focus:bg-paper"
        />
        <button type="submit" aria-label="Pesquisar" className="icon-button absolute top-0.5 right-1 text-slate"><Search size={19} /></button>
      </div>
      {expanded && (
        <div className="search-suggestions absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-xl border border-line bg-paper shadow-lg">
          <p className="border-b border-line px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate">Encontra algo especial</p>
          <ul id={listId} role="listbox" aria-label="Sugestões de produtos" className="max-h-[min(55dvh,24rem)] overflow-y-auto overscroll-contain p-1.5">
            {suggestions.map((product, index) => (
              <li
                key={product.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseProduct(product.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-mist ${index === activeIndex ? "bg-mist" : ""}`}
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-mist">
                  <ProductImage product={product} loading="eager" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{product.name}</span>
                  <span className="mt-0.5 block text-xs text-slate">{product.category} · {product.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</span>
                </span>
                <ArrowUpRight aria-hidden="true" size={16} className="shrink-0 text-slate" />
              </li>
            ))}
          </ul>
          {suggestions.length === 0 && <p className="px-4 pb-4 text-sm text-slate">Nenhum produto encontrado. Experimenta outro nome.</p>}
          <p className="border-t border-line px-4 py-2.5 text-xs text-slate">↑ ↓ para escolher · Enter para pesquisar</p>
        </div>
      )}
    </form>
  )
}

export default HeaderSearch
