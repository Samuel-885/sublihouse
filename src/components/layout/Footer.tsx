const footerLinks = {
  Produtos: [
    "Canecas",
    "Fotopresentes",
    "Papelaria",
    "Porta-chaves",
  ],
  Ajuda: [
    "Perguntas frequentes",
    "Envios",
    "Trocas e devoluções",
    "Contacto",
  ],
}

function Footer() {
  return (
    <footer className="border-t border-line bg-[#FCFBF8]">
      <div className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-18 lg:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-semibold">
              Sublime House
            </p>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate">
              Presentes personalizados para momentos que merecem ficar.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold">
                {title}
              </h3>

              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate transition-colors hover:text-pink"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-semibold">
              Segue-nos
            </h3>

            <div className="mt-4 flex gap-4">
              <a
                href="#"
                className="text-sm text-slate transition-colors hover:text-pink"
              >
                Instagram
              </a>

              <a
                href="#"
                className="text-sm text-slate transition-colors hover:text-pink"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-xs text-slate">
            © 2026 Sublime House. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer