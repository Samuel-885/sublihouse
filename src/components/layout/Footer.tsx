function Footer() {
  return (
    <footer id="contacto" className="bg-[#FCFBF8]">
      <div className="mx-auto max-w-360 px-4 pb-6 pt-10 sm:px-6 lg:px-18">
        {/* Linha multicolorida */}
        <div className="grid h-1 grid-cols-4">
          <div className="bg-blue" />
          <div className="bg-pink" />
          <div className="bg-orange" />
          <div className="bg-violet" />
        </div>

        {/* Conteúdo */}
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Sublime House
            </h2>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate">
              Presentes personalizados com cor, memória e personalidade.
            </p>
          </div>

          {/* Produtos */}
          <div>
            <h3 className="text-sm font-semibold">
              Produtos
            </h3>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate">
              <a href="/products" className="hover:text-ink">
                Canecas
              </a>

              <a href="/products" className="hover:text-ink">
                Fotopresentes
              </a>

              <a href="/products" className="hover:text-ink">
                Papelaria
              </a>

              <a href="/products" className="hover:text-ink">
                Porta-chaves
              </a>
            </div>
          </div>

          {/* Ajuda */}
          <div>
            <h3 className="text-sm font-semibold">
              Ajuda
            </h3>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate">
              <a href="#contacto" className="hover:text-ink">
                Contacto
              </a>

              <a href="#" className="hover:text-ink">
                Envios
              </a>

              <a href="#" className="hover:text-ink">
                Trocas e devoluções
              </a>

              <a href="#" className="hover:text-ink">
                Perguntas frequentes
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold">
              Segue-nos
            </h3>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate">
              <a href="#" className="hover:text-ink">
                Instagram
              </a>

              <a href="#" className="hover:text-ink">
                Facebook
              </a>

              <a href="#" className="hover:text-ink">
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="flex flex-col gap-3 border-t border-line pt-5 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            © Sublime House · Portugal
          </p>

          <p>
            Multibanco · MB Way · Cartão
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer