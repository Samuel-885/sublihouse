const benefits = [
  {
    title: "Feito com carinho",
    description: "Presentes pensados para momentos especiais.",
  },
  {
    title: "Personalização fácil",
    description: "Cria e acompanha a tua prenda em tempo real.",
  },
  {
    title: "Envio para Portugal",
    description: "Recebe a tua encomenda onde estiveres.",
  },
  {
    title: "Compra segura",
    description: "Checkout e pagamento protegidos.",
  },
]

function Benefits() {
  return (
    <section className="bg-paper py-10 sm:py-12">
      <div className="mx-auto grid max-w-360 grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-18">
        {benefits.map((benefit) => (
          <div key={benefit.title}>
            <span className="font-display text-2xl text-pink">
              ✦
            </span>

            <h3 className="mt-3 font-semibold">
              {benefit.title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Benefits