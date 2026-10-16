import { useEffect, useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  heading?: ReactNode
  side?: "left" | "right"
  children: ReactNode
}

function Drawer({ open, onClose, title, heading, side = "right", children }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return

    const scrollY = window.scrollY
    const pathname = window.location.pathname
    const body = document.body
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.width = "100%"
    body.style.overflow = "hidden"
    if (scrollbar) body.style.paddingRight = `${scrollbar}px`
    dialog.showModal()

    // O diálogo nativo contém o foco e torna o restante da página inerte.
    const desktop = window.matchMedia("(min-width: 1024px)")
    function handleResize() {
      if (desktop.matches) onClose()
    }
    desktop.addEventListener("change", handleResize)
    handleResize()

    return () => {
      desktop.removeEventListener("change", handleResize)
      dialog.close()
      Object.assign(body.style, previous)
      if (window.location.pathname === pathname) {
        window.scrollTo({ top: scrollY, behavior: "instant" })
      }
    }
  }, [open, onClose])

  return (
    <dialog
      ref={dialogRef}
      className={`site-drawer site-drawer--${side}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
      }}
    >
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper px-6 py-5">
          <h2 id={titleId} className="font-display text-2xl font-semibold">{heading ?? title}</h2>
          <button type="button" autoFocus onClick={onClose} aria-label={`Fechar ${title === "Sublime House" ? "menu" : "filtros"}`} className="icon-button shrink-0 border border-line">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export default Drawer
