import { Link } from "react-router"

type ProductCardProps = {
  id: number
  name: string
  price: number
  color: string
  badge?: string
  
}

const colorClasses: Record<string, string> = {
  blue: "bg-blue",
  pink: "bg-pink",
  orange: "bg-orange",
  violet: "bg-violet",
  yellow: "bg-yellow",
  teal: "bg-teal",
}

function ProductCard({
  id,
  name,
  price,
  color,
  badge,
}: ProductCardProps) {
  const accentColor = colorClasses[color] ?? "bg-blue"

  return (
    <article className="group">
      <Link
        to={`/products/${id}`}
        className="block"
      >
        {/* Área da imagem */}
        <div className="relative aspect-square overflow-hidden bg-mist">
          {/* Badge */}
          {badge && (
            <span className="absolute left-3 top-3 z-20 bg-paper px-2.5 py-1 text-xs font-semibold">
              {badge}
            </span>
          )}

          {/* Accent colorido */}
          <div
            className={`absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 transition duration-300 group-hover:scale-110 ${accentColor}`}
          />

          {/* Placeholder do produto */}
          <div className="absolute left-1/2 top-1/2 flex h-[58%] w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-ink bg-paper transition duration-300 group-hover:translate-y-[-52%]">
            <span className="px-3 text-center text-xs font-semibold text-slate">
              Produto
            </span>
          </div>
        </div>

        {/* Informações */}
        <div className="pt-4">
          <h3 className="font-medium leading-6 text-ink transition group-hover:text-pink">
            {name}
          </h3>

          <p className="mt-1 font-semibold text-ink">
            {price.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard