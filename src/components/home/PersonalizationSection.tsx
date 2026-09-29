function PersonalizationSection() {
  return (
    <section
      id="personalizar"
      className="bg-mist py-10 sm:py-12 lg:py-16"
    >
      <div className="mx-auto grid max-w-360 gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-center lg:gap-16 lg:px-18">
        {/* Preview */}
        <div className="flex min-h-72 items-center justify-center rounded-2xl bg-paper p-8 sm:min-h-80 lg:min-h-96">
          <div className="flex h-48 w-40 items-center justify-center rounded-xl border-2 border-ink bg-paper">
            <span className="font-display text-3xl font-semibold text-pink">
              Sofia
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div>
          <p className="mb-3 text-xs font-bold tracking-wide text-violet">
            CRIA A TUA PRENDA
          </p>

          <h2 className="font-display max-w-xl text-3xl leading-tight font-semibold sm:text-4xl">
            Faz uma prenda que não existe em nenhuma prateleira.
          </h2>

          <p className="mt-5 max-w-lg leading-7 text-slate">
            Escolhe o produto, adiciona a tua fotografia, nome, cores e
            detalhes e acompanha a personalização em tempo real.
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <p className="font-semibold">1. Escolhe</p>
              <p className="text-sm text-slate">
                Começa pelo produto que queres personalizar.
              </p>
            </div>

            <div>
              <p className="font-semibold">2. Personaliza</p>
              <p className="text-sm text-slate">
                Adiciona nomes, fotografias, fontes e cores.
              </p>
            </div>

            <div>
              <p className="font-semibold">3. Encomenda</p>
              <p className="text-sm text-slate">
                Revê a prévia e adiciona a criação ao carrinho.
              </p>
            </div>
          </div>

          <a
            href="#"
            className="mt-8 inline-block rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper transition-transform duration-200 hover:-translate-y-0.5"
          >
            Começar a personalizar
          </a>
        </div>
      </div>
    </section>
  )
}

export default PersonalizationSection