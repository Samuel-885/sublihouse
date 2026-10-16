import { Link } from "react-router"

function FinalCTA() {
  return (
    <section className="bg-[#FCFBF8] py-12 sm:py-14 lg:py-18">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-18">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-paper px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-16 lg:py-16">
          {/* Detalhes decorativos */}
          <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-pink/10" />
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-orange/10" />

          <div className="relative mx-auto max-w-2xl">
            <p className="mb-3 text-xs font-bold tracking-wide text-pink">
              FAZ À TUA MANEIRA
            </p>

            <h2 className="font-display text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
              Tens uma ideia? Nós damos forma.
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-7 text-slate">
              Cria uma prenda personalizada com fotografias, nomes, cores e
              detalhes escolhidos por ti.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/personalizados"
                className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper transition-transform duration-200 hover:-translate-y-0.5"
              >
                Criar a tua prenda
              </Link>

              <a
                href="#produtos"
                className="rounded-xl border border-ink px-5 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-ink hover:text-paper"
              >
                Ver produtos
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
