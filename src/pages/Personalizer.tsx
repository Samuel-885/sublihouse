import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { products } from "../data/products"
import { MessageCircle, Minus, Plus } from "lucide-react"
import { useCart } from "../context/useCart"

const personalizationColors = [
  {
    name: "Rosa",
    value: "#E31C79",
  },
  {
    name: "Azul",
    value: "#0B84D1",
  },
  {
    name: "Laranja",
    value: "#F2891C",
  },
  {
    name: "Roxo",
    value: "#4B2E93",
  },
]

function Personalizer() {
  const { id } = useParams()

  const [customName, setCustomName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#E31C79")
  const [selectedFont, setSelectedFont] = useState("Figtree")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const { addToCart } = useCart()

    useEffect(() => {
    return () => {
        if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
        }
    }
    }, [imagePreview])

  const product = products.find(
    (product) => product.id === Number(id)
  )

  if (!product || !product.customizable) {
    return (
      <section className="mx-auto max-w-360 px-4 py-20 sm:px-6 lg:px-18">
        <h1 className="font-display text-3xl font-semibold">
          Produto não disponível para personalização
        </h1>

        <Link
          to="/products"
          className="mt-6 inline-block font-semibold underline underline-offset-4"
        >
          Voltar aos produtos
        </Link>
      </section>
    )
  }

    function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
        return
    }

    setSelectedImage(file)

    const previewUrl = URL.createObjectURL(file)

    setImagePreview(previewUrl)
    }

    function decreaseQuantity() {
      setQuantity((currentQuantity) =>
        Math.max(1, currentQuantity - 1)
      )
    }

    function increaseQuantity() {
      setQuantity((currentQuantity) => currentQuantity + 1)
    }

    function handleAddCustomizedProduct() {
      if (!product) {
        return
      }

      setErrorMessage("")
      setSuccessMessage("")

      const hasName = customName.trim().length > 0
      const hasImage = selectedImage !== null

      if (!hasName && !hasImage) {
        setErrorMessage(
          "Adiciona pelo menos um nome ou uma fotografia para personalizar o produto."
        )

        return
      }

      addToCart(product, quantity, {
        name: customName.trim(),
        color: selectedColor,
        font: selectedFont,
        imageName: selectedImage?.name,
      })

      setSuccessMessage(
        `${product.name} foi adicionado ao carrinho.`
      )
    }

  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-18 lg:py-14">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
          <Link to="/" className="hover:text-ink">
            Início
          </Link>

          <span>/</span>

          <Link to={`/products/${product.id}`} className="hover:text-ink">
            {product.name}
          </Link>

          <span>/</span>

          <span className="text-ink">
            Personalizar
          </span>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
          {/* Preview */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue">
              Prévia em tempo real
            </p>

            <div className="sticky top-6 mt-4 flex min-h-125 items-center justify-center border border-line bg-paper p-8">
              <div className="relative flex h-80 w-64 items-center justify-center border-2 border-ink bg-paper">
                <div className="absolute h-44 w-44 rounded-full bg-orange/10" />

                <div className="relative z-10 text-center">
                    <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg bg-mist">
                    {imagePreview ? (
                        <img
                        src={imagePreview}
                        alt="Prévia da fotografia personalizada"
                        className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate">
                        A tua foto
                        </div>
                    )}
                    </div>

                  <p
                    className="mt-6 text-3xl font-semibold"
                    style={{
                      color: selectedColor,
                      fontFamily: selectedFont,
                    }}
                  >
                    {customName || "O teu nome"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="bg-paper p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-pink">
              Personaliza
            </p>

            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Faz esta prenda à tua maneira.
            </h1>

            <p className="mt-3 leading-7 text-slate">
              Personaliza {product.name} e acompanha cada alteração na prévia.
            </p>

            {/* Fotografia */}
            <div className="mt-8">
            <label
                htmlFor="custom-image"
                className="text-sm font-semibold"
            >
                Fotografia
            </label>

            <input
                id="custom-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-3 block w-full text-sm text-slate file:mr-4 file:border-0 file:bg-mist file:px-4 file:py-3 file:text-sm file:font-semibold file:text-ink"
            />

            <p className="mt-2 text-xs text-slate">
                JPG, PNG ou outra imagem suportada pelo navegador.
            </p>

            {selectedImage && (
            <p className="mt-2 text-xs font-medium text-ink">
                Selecionada: {selectedImage.name}
            </p>
            )}
            </div>

            {/* Nome */}
            <div className="mt-8">
              <label
                htmlFor="custom-name"
                className="text-sm font-semibold"
              >
                Nome
              </label>

              <input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                maxLength={20}
                placeholder="Ex.: Sofia"
                className="mt-3 w-full border border-line bg-paper px-4 py-3 outline-none transition focus:border-ink"
              />

              <p className="mt-2 text-right text-xs text-slate">
                {customName.length}/20
              </p>
            </div>

            {/* Cor */}
            <div className="mt-8">
              <p className="text-sm font-semibold">
                Cor do texto
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                {personalizationColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => setSelectedColor(color.value)}
                    className={`h-10 w-10 rounded-full border-2 ${
                      selectedColor === color.value
                        ? "border-ink"
                        : "border-transparent"
                    }`}
                    style={{
                      backgroundColor: color.value,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Fonte */}
            <div className="mt-8">
              <label
                htmlFor="font"
                className="text-sm font-semibold"
              >
                Fonte
              </label>

              <select
                id="font"
                value={selectedFont}
                onChange={(event) => setSelectedFont(event.target.value)}
                className="mt-3 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink"
              >
                <option value="Figtree">
                  Figtree
                </option>

                <option value="Fredoka">
                  Fredoka
                </option>
              </select>
            </div>

            {/* Quantidade */}
            <div className="mt-8">
              <p className="text-sm font-semibold">
                Quantidade
              </p>

              <div className="mt-3 inline-flex items-center border border-line">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity === 1}
                  aria-label="Diminuir quantidade"
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>

                <span className="flex h-11 min-w-12 items-center justify-center border-x border-line text-sm font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  aria-label="Aumentar quantidade"
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-mist"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>


            <div className="mt-10 border-t border-line pt-6">
              {errorMessage && (
                <div className="mb-4 border border-pink bg-pink/5 px-4 py-3 text-sm text-pink">
                  {errorMessage}
                </div>
              )}              
              <button
                type="button"
                onClick={handleAddCustomizedProduct}
                className="w-full bg-ink px-5 py-4 text-sm font-bold text-paper"
              >
                Adicionar personalizado ao carrinho
              </button>
              {successMessage && (
                <div className="mt-4 border border-teal bg-teal/5 px-4 py-3">
                  <p className="text-sm text-ink">
                    {successMessage}
                  </p>

                  <Link
                    to="/cart"
                    className="mt-2 inline-block text-sm font-bold underline underline-offset-4"
                  >
                    Ver carrinho
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-line pt-6">
              <div className="h-1 w-9 rounded-full bg-orange" />

              <h2 className="mt-3 font-display text-xl font-semibold">
                Precisas de algo diferente?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate">
                Se a personalização que procuras não estiver disponível nas opções acima,
                fala connosco pelo WhatsApp para combinar os detalhes.
              </p>

              <a
                href={`https://wa.me/31988909334?text=${encodeURIComponent(
                  `Olá! Gostaria de pedir uma personalização especial para o produto: ${product.name}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 border border-ink bg-paper px-5 py-3 text-sm font-bold transition hover:bg-mist"
              >
                <MessageCircle size={18} />
                Falar pelo WhatsApp
              </a>
            </div>            

          </div>
        </div>
      </div>
    </section>
  )
}

export default Personalizer