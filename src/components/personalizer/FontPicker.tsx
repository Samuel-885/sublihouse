import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { fontCatalog, fontCategories, fontStack, loadFont, resolveFont, type FontFamily } from "./editor/fontCatalog"

/** Select-only combobox: focus stays on the trigger; only the list scrolls. */
export default function FontPicker({ value, onChange, disabled = false }: { value: FontFamily; onChange: (family: FontFamily) => void; disabled?: boolean }) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState({ left: 0, top: 0, width: 0, maxHeight: 0 })

  useEffect(() => {
    void loadFont({ fontFamily: value, fontWeight: 400, fontStyle: "normal" })
  }, [value])

  useEffect(() => {
    if (!open) return
    // The catalog loader caches promises (including requests already in flight).
    for (const font of fontCatalog) void loadFont({ fontFamily: font.family, fontWeight: 400, fontStyle: "normal" })
    const outside = (event: Event) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !list.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("focusin", outside)
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside) }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    const position = () => {
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect) return
      const viewport = window.visualViewport
      const top = (viewport?.offsetTop ?? 0) + 8
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) - 8
      const width = Math.min(rect.width, (viewport?.width ?? innerWidth) - 16)
      const below = Math.max(0, bottom - rect.bottom - 4)
      const above = Math.max(0, rect.top - top - 4)
      const down = below >= Math.min(320, above)
      const maxHeight = Math.min(320, down ? below : above)
      setPlacement({ left: Math.max(8, Math.min(rect.left, innerWidth - width - 8)), top: down ? rect.bottom + 4 : rect.top - maxHeight - 4, width, maxHeight })
    }
    position()
    // A portal avoids clipping by the desktop panel's internal scroll container.
    const onScroll = (event: Event) => { if (event.target !== list.current) position() }
    window.addEventListener("resize", position)
    document.addEventListener("scroll", onScroll, true)
    window.visualViewport?.addEventListener("resize", position)
    window.visualViewport?.addEventListener("scroll", position)
    return () => {
      window.removeEventListener("resize", position)
      document.removeEventListener("scroll", onScroll, true)
      window.visualViewport?.removeEventListener("resize", position)
      window.visualViewport?.removeEventListener("scroll", position)
    }
  }, [open])

  useLayoutEffect(() => {
    const menu = list.current
    const option = menu?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    if (!open || !menu || !option) return
    // Never scrollIntoView: that would also scroll the page/desktop panel.
    const top = option.offsetTop
    if (active === 0) menu.scrollTop = 0
    else if (top < menu.scrollTop) menu.scrollTop = top
    else if (top + option.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = top + option.offsetHeight - menu.clientHeight
  }, [active, open, placement.maxHeight])

  function show() {
    setActive(fontCatalog.findIndex(font => font.family === value))
    setOpen(true)
  }
  function close() {
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }
  function choose(index: number) {
    onChange(fontCatalog[index].family)
    close()
  }
  function keydown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Tab") { setOpen(false); return }
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); return }
    if (["Enter", " ", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault()
      if (!open) { show(); return }
      if (event.key === "Enter" || event.key === " ") choose(active)
      else setActive(index => event.key === "Home" ? 0 : event.key === "End" ? fontCatalog.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + fontCatalog.length) % fontCatalog.length)
    }
  }

  return <div className="pz-control">
    <span id={`${id}-label`}>Fonte</span>
    <button ref={trigger} type="button" role="combobox" className="pz-font-trigger" aria-label="Fonte" aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? `${id}-list` : undefined} aria-activedescendant={open ? `${id}-option-${active}` : undefined} disabled={disabled} onClick={() => open ? close() : show()} onKeyDown={keydown}>
      <span style={{ fontFamily: fontStack(value) }}>{resolveFont(value).label}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="pz-font-list" style={placement}>
      {fontCategories.map(category => <div key={category} role="group" aria-labelledby={`${id}-${category}`}>
        <div id={`${id}-${category}`} className="pz-font-category">{category}</div>
        {fontCatalog.map((font, index) => font.category === category && <div key={font.family} id={`${id}-option-${index}`} role="option" aria-selected={value === font.family} data-index={index} data-active={active === index} className="pz-font-option" onClick={() => choose(index)}>
          <span style={{ fontFamily: fontStack(font.family) }}>{font.label}</span>
        </div>)}
      </div>)}
    </div>, document.body)}
  </div>
}
