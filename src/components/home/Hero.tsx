import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router"

import { useReducedMotion } from "../../hooks/useReducedMotion"

const heroProducts = [
  {
    id: 1,
    image: "/images/hero/product-1.png",
    alt: "Canecas personalizadas da Sublime House",
  },
  {
    id: 2,
    image: "/images/hero/product-2.png",
    alt: "Produtos personalizados da Sublime House",
  },
  {
    id: 3,
    image: "/images/hero/product-3.png",
    alt: "Presentes personalizados da Sublime House",
  },
  {
    id: 4,
    image: "/images/hero/product-4.png",
    alt: "Coleção personalizada da Sublime House",
  },
]

function Hero() {
  const [activeProduct, setActiveProduct] = useState(0)

  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveProduct(
        (currentProduct) =>
          (currentProduct + 1) % heroProducts.length
      )
    }, 6000)

    return () => {
      window.clearInterval(interval)
    }
  }, [reducedMotion])

  return (
    <section className="bg-[#F7F4F0]">
      <div
        className="
          mx-auto grid max-w-360
          min-h-[calc(100dvh-88px)]
          grid-rows-[58%_42%]
          px-4
          sm:px-6
          md:min-h-0
          md:grid-cols-[0.9fr_1.1fr]
          md:grid-rows-1
          md:px-10
          lg:min-h-152.5
          lg:px-18
        "
      >
        {/* Conteúdo */}
        <div
          className="
            order-2 flex min-w-0 flex-col justify-center
            pb-6
            md:order-1
            md:py-14
            lg:py-16
          "
        >
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate sm:text-xs">
            <span className="h-1 w-7 rounded-full bg-pink" />

            Presentes personalizados
          </p>

          <h1
            className="
              mt-3 max-w-xl font-display
              text-[2rem] leading-[1.05] font-semibold
              sm:text-[2.5rem]
              md:mt-5 md:text-5xl
              lg:text-6xl
            "
          >
            Presentes com a tua personalidade.
          </h1>

          <p
            className="
              mt-3 max-w-md
              text-sm leading-6 text-slate
              md:mt-5 md:text-base md:leading-7
            "
          >
            Fotografias, nomes e momentos transformados em prendas únicas,
            criadas especialmente para quem importa.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-5 md:mt-7">
            <Link
              to="/products?customizable=true"
              className="action-button inline-flex items-center gap-3 rounded-lg bg-ink px-5 py-3.5 text-sm font-bold text-paper"
            >
              Criar a tua prenda

              <ArrowUpRight size={16} />
            </Link>

            <Link
              to="/products"
              className="text-sm font-semibold underline decoration-line underline-offset-5 transition-colors hover:text-pink"
            >
              Ver produtos
            </Link>
          </div>
        </div>

        {/* Produtos */}
        <div
          className="
            relative order-1
            flex min-h-0 items-center justify-center
            overflow-hidden
            md:order-2 md:min-h-125
          "
        >
          {/* Fundo decorativo */}
          <div
            aria-hidden="true"
            className="
              absolute h-[72%] w-[72%]
              rounded-full bg-pink/6
              md:h-[78%] md:w-[78%]
            "
          />

          {/* Imagens que alternam */}
          <div className="relative z-10 h-full w-full">
            {heroProducts.map((product, index) => (
              <img
                key={product.id}
                src={product.image}
                alt={index === activeProduct ? product.alt : ""}
                aria-hidden={index !== activeProduct}
                className={`
                  absolute inset-0
                  h-full w-full
                  object-contain
                  transition-all duration-3400 ease-in-out
                  ${
                    index === activeProduct
                      ? "scale-100 opacity-100"
                      : "pointer-events-none scale-[0.97] opacity-0"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero