type CategoryCardProps = {
  name: string
  color: string
}

function CategoryCard({ name, color }: CategoryCardProps) {
  return (
    <a
      href="#"
      className="group block"
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
    </a>
  )
}

export default CategoryCard