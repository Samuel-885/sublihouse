import { Link } from "react-router"

type CategoryCardProps = {
  name: string
  color: string
  image: string
}

function CategoryCard({ name, color, image }: CategoryCardProps) {
  const destination =
    name === "Criar a tua prenda"
      ? "/products?customizable=true"
      : `/products?${new URLSearchParams({ category: name })}`

  return (
    <Link
      to={destination}
      className="group block transition-transform duration-200 hover:-translate-y-1"
    >
      <div
        className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border bg-mist p-3 transition duration-300 group-hover:shadow-md"
        style={{
          borderColor: `${color}22`,
        }}
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />

        <h3 className="text-sm font-semibold">
          {name}
        </h3>
      </div>
    </Link>
  )
}

export default CategoryCard