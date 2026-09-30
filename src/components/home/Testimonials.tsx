const testimonials = [
  {
    id: 1,
    name: "Mariana",
    text: "A prenda ficou ainda mais bonita do que eu imaginava. A personalização fez toda a diferença.",
    product: "Caneca personalizada",
    accent: "bg-blue",
  },
  {
    id: 2,
    name: "Beatriz",
    text: "Foi muito simples escolher e personalizar. É daquelas prendas que realmente têm significado.",
    product: "Fotopresente",
    accent: "bg-pink",
  },
  {
    id: 3,
    name: "João",
    text: "Gostei muito do cuidado com os detalhes e da qualidade final. Voltaria a encomendar.",
    product: "Presente personalizado",
    accent: "bg-orange",
  },
]

function Testimonials() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-360 px-4 py-16 sm:px-6 lg:px-18 lg:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-pink">
            Quem já personalizou
          </p>

          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Prendas que ficam na memória.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate sm:text-base">
            Algumas palavras de quem já transformou uma ideia numa prenda
            especial.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="border border-line bg-paper p-6"
            >
              <div
                className={`h-1 w-10 rounded-full ${testimonial.accent}`}
              />

              <div
                className="mt-5 text-sm tracking-widest text-orange"
                aria-label="5 estrelas"
              >
                ★★★★★
              </div>

              <p className="mt-5 leading-7 text-ink">
                “{testimonial.text}”
              </p>

              <div className="mt-6 border-t border-line pt-4">
                <p className="font-semibold">
                  {testimonial.name}
                </p>

                <p className="mt-1 text-sm text-slate">
                  {testimonial.product}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials