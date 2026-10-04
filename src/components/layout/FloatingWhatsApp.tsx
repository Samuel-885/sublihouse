import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { createWhatsAppUrl } from "../../data/contact"

function FloatingWhatsApp() {
  const [showOnMobile, setShowOnMobile] = useState(false)

  const whatsappUrl = createWhatsAppUrl(
    "Olá! Gostaria de saber mais sobre os produtos da Sublime House."
  )

  useEffect(() => {
    function handleScroll() {
      setShowOnMobile(window.scrollY > 250)
    }

    handleScroll()

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Sublime House pelo WhatsApp"
      title="Falar pelo WhatsApp"
      className={`group fixed right-4 bottom-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 sm:right-6 sm:bottom-6 sm:h-14 sm:w-14 ${
        showOnMobile
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:opacity-100"
      }`}
    >
      <MessageCircle size={25} />
    </a>
  )
}

export default FloatingWhatsApp