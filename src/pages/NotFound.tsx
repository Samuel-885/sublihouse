import { Link } from "react-router"

function NotFound() {
  return (
    <section className="mx-auto max-w-360 px-4 py-20 text-center sm:px-6 lg:px-18">
      <p className="text-xs font-bold uppercase tracking-wider text-pink">Erro 404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">Página não encontrada</h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-slate">
        Esta página não existe. Volta ao início para encontrar a tua próxima prenda.
      </p>
      <Link to="/" className="mt-8 inline-flex bg-ink px-6 py-3 text-sm font-bold text-paper">
        Voltar à Home
      </Link>
    </section>
  )
}

export default NotFound
