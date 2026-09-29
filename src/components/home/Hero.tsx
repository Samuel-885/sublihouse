function Hero() {
  return (
    <section className="bg-[#FCFBF8]">
      <div className="mx-auto grid max-w-360 gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:items-center md:py-14 lg:gap-14 lg:px-18 lg:py-16">
        {/* Conteúdo */}
        <div>
          <p className="mb-3 text-xs font-bold tracking-wide text-orange">
            PRESENTES PERSONALIZADOS
          </p>

          <h1 className="font-display max-w-xl text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
            Presentes com a tua personalidade.
          </h1>

          <p className="mt-5 max-w-lg font-body text-base leading-7 text-slate">
            Fotografias, nomes e momentos transformados em prendas únicas.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#personalizar"
              className="rounded-[10px] bg-ink px-5 py-3 text-center text-sm font-bold text-paper transition-transform hover:-translate-y-0.5"
            >
              Criar a tua prenda
            </a>

            <a
              href="#produtos"
              className="rounded-[10px] border border-ink px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              Ver produtos
            </a>
          </div>
        </div>

        {/* Visual temporário */}
        <div className="relative min-h-70 overflow-hidden rounded-[18px] bg-mist sm:min-h-85 lg:min-h-105">
          <div className="absolute top-1/2 left-8 h-36 w-36 -translate-y-1/2 rounded-full bg-pink sm:h-44 sm:w-44 lg:left-14 lg:h-52 lg:w-52" />

          <div className="absolute top-1/2 right-8 flex h-40 w-32 -translate-y-1/2 items-center justify-center rounded-[14px] border-2 border-ink bg-paper sm:h-48 sm:w-38 lg:right-16 lg:h-56 lg:w-44">
            <span className="font-display text-3xl font-semibold text-violet">
              TU
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero