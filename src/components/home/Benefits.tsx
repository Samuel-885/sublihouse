const benefits = [
  {
    id: 1,
    title: "Produtos personalizados",
    description: "Feitos para cada pessoa e momento.",
    color: "bg-blue",
  },
  {
    id: 2,
    title: "Produção cuidada",
    description: "Atenção aos detalhes em cada peça.",
    color: "bg-pink",
  },
  {
    id: 3,
    title: "Compra segura",
    description: "Checkout e pagamento protegidos.",
    color: "bg-violet",
  },
  {
    id: 4,
    title: "Encomenda simples",
    description: "Escolhe, personaliza e finaliza.",
    color: "bg-orange",
  },
]

function Benefits() {
  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-360 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-18">
        {benefits.map((benefit) => (
          <article key={benefit.id}>
            <div
              className={`h-1 w-9 rounded-full ${benefit.color}`}
            />

            <h3 className="mt-3 font-semibold">
              {benefit.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate">
              {benefit.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Benefits