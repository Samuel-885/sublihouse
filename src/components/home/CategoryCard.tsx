import { Link } from "react-router"

type CategoryCardProps = {
  name: string
  color: string
}

function CategoryCard({ name, color }: CategoryCardProps) {
  return (
    <Link
      to={name === "Criar a tua prenda" ? "/products?customizable=true" : `/products?${new URLSearchParams({ category: name })}`}
      className="group block transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl bg-mist">
        <div
          className="h-20 w-20 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: color }}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold">
        {name}
      </h3>
    </Link>
  )
}

export default CategoryCard
