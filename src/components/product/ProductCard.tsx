type ProductCardProps = {
  name: string
  price: number
  color: string
  badge?: string
}

function ProductCard({
  name,
  price,
  color,
  badge,
}: ProductCardProps) {
  return (
    <article className="group">
      <a href="#" className="block">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-mist">
          {badge && (
            <span className="absolute top-3 left-3 rounded-md bg-paper px-2 py-1 text-xs font-semibold">
              {badge}
            </span>
          )}

          <div
            className="h-24 w-24 rounded-full transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="mt-3">
          <h3 className="text-sm font-semibold">
            {name}
          </h3>

          <p className="mt-1 font-display text-base font-semibold">
            {price.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>
      </a>
    </article>
  )
}

export default ProductCard