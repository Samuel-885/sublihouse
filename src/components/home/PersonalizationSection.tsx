import { Link } from "react-router"

function PersonalizationSection() {
  return (
    <section
      id="personalizar"
      className="border-y border-violet/10 bg-violet/5"
    >
      <div className="mx-auto grid max-w-360 gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center lg:px-18 lg:py-20">
        {/* Prévia */}
        <div className="rounded-xl border border-line bg-paper p-4 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">
            Prévia em tempo real
          </p>

          <div className="mx-auto mt-5 w-full max-w-145">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              {/* Caneca base */}
              <img
                src="/images/personalization/caneca-base.png"
                alt="Exemplo de caneca personalizada"
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* Nome de exemplo */}
              <div
                className="
                  pointer-events-none
                  absolute
                  left-[34%]
                  top-[67.2%]
                  z-20
                  flex
                  w-[27.5%]
                  items-center
                  justify-center
                  overflow-hidden
                  text-center
                "
              >
              <span
                className="
                  block
                  max-w-full
                  overflow-hidden
                  text-ellipsis
                  whitespace-nowrap
                  font-semibold
                  leading-none
                  text-pink
                "
                style={{
                  fontSize: "clamp(0.72rem, 2.2vw, 1.65rem)",
                }}
              >
                Seu nome aqui
              </span>
              </div>
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

              <span className="text-sm font-semibold">Escolhe</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink text-xs font-bold text-paper">
                2
              </span>

              <span className="text-sm font-semibold">Personaliza</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-xs font-bold text-paper">
                3
              </span>

              <span className="text-sm font-semibold">Encomenda</span>
            </div>
          </div>

          <Link
            to="/products?customizable=true"
            className="action-button mt-8 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:opacity-85"
          >
            Começar a personalizar
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PersonalizationSection