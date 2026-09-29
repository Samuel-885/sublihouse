import CategoryCard from "./CategoryCard"

const categories = [
  {
    name: "Canecas",
    color: "#0B84D1",
  },
  {
    name: "Criar a tua prenda",
    color: "#E31C79",
  },
  {
    name: "Fotopresentes",
    color: "#F2891C",
  },
  {
    name: "Papelaria",
    color: "#4B2E93",
  },
  {
    name: "Porta-chaves",
    color: "#0FA3B1",
  },
  {
    name: "Ímanes",
    color: "#F5C443",
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
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories