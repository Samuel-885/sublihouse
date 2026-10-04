import { Link } from "react-router"

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
          <img
            src="/images/brand/sublihouse-logo.png"
            alt="Sublime House"
            className="h-20 w-auto object-contain"
          />

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
              <Link to="/products?category=Canecas" className="hover:text-ink">
                Canecas
              </Link>

              <Link to="/products?category=Fotopresentes" className="hover:text-ink">
                Fotopresentes
              </Link>

              <Link to="/products?category=Papelaria" className="hover:text-ink">
                Papelaria
              </Link>

              <Link to="/products?category=Porta-chaves" className="hover:text-ink">
                Porta-chaves
              </Link>
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

              <span>Envios — em breve</span>

              <span>Trocas e devoluções — em breve</span>

              <Link to="/#perguntas-frequentes" className="hover:text-ink">
                Perguntas frequentes
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold">
              Segue-nos
            </h3>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate">
              <span>Instagram — em breve</span>
              <span>Facebook — em breve</span>
              <span>WhatsApp — em breve</span>
              <p className="text-xs">Inspiração para prendas com personalidade.</p>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="flex flex-col gap-3 border-t border-line pt-5 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            © SubliHouse · Portugal
          </p>

          <p>
            SubliHouse · Presentes personalizados
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
