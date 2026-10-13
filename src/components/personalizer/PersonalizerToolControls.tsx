import { useEffect, useRef, useState } from "react"
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, Crop, RefreshCw, Trash2 } from "lucide-react"
import type { DesignStore } from "./editor/createDesignStore"
import { MAX_FONT_SIZE, MIN_FONT_SIZE, MIN_PHOTO_SIZE } from "./editor/geometry"
import type { PersonalizationElement, TextElement } from "./editor/types"

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  return <label className="pz-control"><span>{label}</span><input type="number" aria-label={label} min={min} max={max} step="any" value={draft ?? Math.round(value * 10) / 10}
    onFocus={event => setDraft(event.target.value)} onBlur={() => setDraft(null)}
    onChange={event => { setDraft(event.target.value); if (event.target.value !== "") onChange(event.target.valueAsNumber) }} /></label>
}
function RangeControl({ label, value, min = 0, max, unit, onChange }: { label: string; value: number; min?: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <label className="pz-control"><span>{label}<span>{Math.round(value)}{unit}</span></span><input type="range" aria-label={label} aria-valuetext={`${Math.round(value)}${unit}`} min={min} max={max} step={1} value={value} onChange={event => onChange(event.target.valueAsNumber)} /></label>
}

export default function PersonalizerToolControls({ element, store, onReplacePhoto, busy, available }: { element: PersonalizationElement; store: DesignStore; onReplacePhoto: () => void; busy: boolean; available: boolean }) {
  const pointerGesture = useRef(false)
  useEffect(() => {
    const finish = () => { if (pointerGesture.current) { pointerGesture.current = false; store.commit() } }
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
    window.addEventListener("blur", finish)
    return () => { finish(); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", finish); window.removeEventListener("blur", finish) }
  }, [store])
  return <fieldset className="pz-tool-controls" disabled={!available} aria-describedby="pz-tools-notice"
    onFocusCapture={event => { if (event.target.matches("input,textarea,select")) store.begin() }}
    onBlurCapture={() => store.commit()}
    onPointerDownCapture={event => { if (event.target instanceof HTMLInputElement && event.target.type === "range") { pointerGesture.current = true; store.begin() } }}
    onKeyDownCapture={event => { if (event.target instanceof HTMLInputElement && event.target.type === "range") store.begin() }}
    onKeyUpCapture={event => { if (event.target instanceof HTMLInputElement && event.target.type === "range") store.commit() }}>
    <legend className="sr-only">Ferramentas de {element.type === "photo" ? "fotografia" : "texto"}</legend>
    <p className="pz-control-heading">Conteúdo</p>
    {element.type === "photo" && <div className="pz-control-row"><button type="button" className="pz-button" disabled={busy} onClick={onReplacePhoto}><RefreshCw size={13} /> Substituir</button><button type="button" className="pz-button" disabled><Crop size={13} /> Recortar</button></div>}
    {element.type === "text" && <>
      <label className="pz-control"><span>Editar conteúdo</span><textarea placeholder="O teu texto" rows={2} maxLength={600} value={element.content} onChange={event => store.updateText(element.id, { content: event.target.value })} /></label>
      <label className="pz-control"><span>Fonte</span><select value={element.font} onChange={event => store.updateText(element.id, { font: event.target.value as TextElement["font"] })}>{["Figtree", "Arial", "Georgia"].map(font => <option key={font}>{font}</option>)}</select></label>
    </>}
    <p className="pz-control-heading">Transformação</p>
    {element.type === "photo" ? <>
      <div className="pz-control-row"><NumberControl label="Largura" value={element.width} min={MIN_PHOTO_SIZE} max={1024} onChange={value => store.resizeElement(element.id, "width", value)} /><NumberControl label="Altura" value={element.height} min={MIN_PHOTO_SIZE} max={512} onChange={value => store.resizeElement(element.id, "height", value)} /></div>
      <label className="pz-aspect-lock"><input type="checkbox" checked={element.lockAspectRatio} onChange={event => store.setAspectLock(element.id, event.target.checked)} /> Manter proporção</label>
    </> : <NumberControl label="Tamanho da fonte" value={element.fontSize} min={MIN_FONT_SIZE} max={MAX_FONT_SIZE} onChange={fontSize => store.updateText(element.id, { fontSize })} />}
    <RangeControl label="Rotação" value={element.rotation * 180 / Math.PI} min={-180} max={180} unit="°" onChange={degrees => store.rotateElement(element.id, degrees * Math.PI / 180)} />
    <div className="pz-control-row"><NumberControl label="Posição horizontal" value={element.x} min={0} max={1024} onChange={x => store.move(element.id, x, element.y, false)} /><NumberControl label="Posição vertical" value={element.y} min={0} max={512} onChange={y => store.move(element.id, element.x, y, false)} /></div>
    <p className="pz-control-heading">Aparência</p>
    {element.type === "photo" ? <RangeControl label="Cantos" value={element.cornerRadius} max={100} unit="%" onChange={value => store.setPhotoCorners(element.id, value)} /> : <>
      <label className="pz-control"><span>Cor</span><input type="color" value={element.color} onChange={event => store.updateText(element.id, { color: event.target.value })} /></label>
      <div className="pz-control"><span>Alinhamento</span><div className="pz-alignment">{([
        ["left", "Alinhar à esquerda", AlignLeft], ["center", "Centrar texto", AlignCenter], ["right", "Alinhar à direita", AlignRight],
      ] as const).map(([align, label, Icon]) => <button key={align} type="button" className="pz-icon-button" aria-label={label} aria-pressed={element.align === align} onClick={() => store.updateText(element.id, { align })}><Icon size={16} /></button>)}</div></div>
    </>}
    <p className="pz-control-heading">Camada</p>
    <div className="pz-control-row"><button type="button" className="pz-button" onClick={() => store.bringForward(element.id)}><ArrowUp size={13} /> Trazer para frente</button><button type="button" className="pz-button" onClick={() => store.sendBackward(element.id)}><ArrowDown size={13} /> Enviar para trás</button></div>
    <p className="pz-control-heading">Ações</p>
    <div className="pz-control-row"><button type="button" className="pz-button" onClick={() => store.duplicate(element.id)}><Copy size={13} /> Duplicar</button><button type="button" className="pz-button pz-delete" disabled={busy} onClick={() => store.remove(element.id)}><Trash2 size={13} /> Apagar</button></div>
  </fieldset>
}
