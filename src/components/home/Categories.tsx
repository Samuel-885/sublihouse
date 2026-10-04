import CategoryCard from "./CategoryCard"

const categories = [
  {
    name: "Canecas",
    color: "#0B84D1",
    image: "/images/products/caneca-tematica.png",
  },
  {
    name: "Criar a tua prenda",
    color: "#E31C79",
    image: "/images/products/caneca-personalizada.png",
  },
  {
    name: "Fotopresentes",
    color: "#F2891C",
    image: "/images/products/fotopresente.png",
  },
  {
    name: "Papelaria",
    color: "#4B2E93",
    image: "/images/products/caderno-personalizado.png",
  },
  {
    name: "Porta-chaves",
    color: "#0FA3B1",
    image: "/images/products/porta-chaves.png",
  },
  {
    name: "Ímanes",
    color: "#F5C443",
    image: "/images/products/iman-personalizado.png",
  },
]

function Categories() {
  return (
    <section className="bg-paper py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-18">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Encontra a tua prenda
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.name}
              name={category.name}
              color={category.color}
              image={category.image}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories