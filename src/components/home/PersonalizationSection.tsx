function PersonalizationSection() {
  return (
    <section id="personalizar" className="bg-mist">
      <div className="mx-auto grid max-w-360 gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center lg:px-18 lg:py-20">
        {/* Prévia */}
        <div className="rounded-xl border border-line bg-paper p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">
            Prévia em tempo real
          </p>

          <div className="relative mt-8 flex min-h-72 items-center justify-center sm:min-h-80">
            {/* Accent */}
            <div className="absolute h-52 w-52 rounded-full bg-orange/10" />

            {/* Produto */}
            <div className="relative z-10 flex h-60 w-48 flex-col items-center rounded-xl border-2 border-ink bg-paper px-6 py-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-mist text-xs text-slate">
                A tua foto
              </div>

              <p className="mt-5 font-display text-2xl font-semibold text-pink">
                Sofia
              </p>
            </div>
          </div>

          <div className="mx-auto mt-5 h-1 w-28 rounded-full bg-blue" />
        </div>

        {/* Conteúdo */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet">
            Criar a tua prenda
          </p>

          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Faz uma prenda que não existe em nenhuma prateleira.
          </h2>

          <p className="mt-5 max-w-xl leading-7 text-slate">
            Adiciona uma fotografia, escreve um nome e escolhe a cor e a fonte.
            A prévia acompanha cada alteração.
          </p>

          {/* Passos */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue text-xs font-bold text-paper">
                1
              </span>

              <span className="text-sm font-semibold">
                Escolhe
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink text-xs font-bold text-paper">
                2
              </span>

              <span className="text-sm font-semibold">
                Personaliza
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-xs font-bold text-paper">
                3
              </span>

              <span className="text-sm font-semibold">
                Encomenda
              </span>
            </div>
          </div>

          <a
            href="#"
            className="mt-8 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:opacity-85"
          >
            Começar a personalizar
          </a>
        </div>
      </div>
    </section>
  )
}

export default PersonalizationSection