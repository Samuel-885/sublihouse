import { useEffect, useRef, useState } from "react"
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, Copy, Crop, Italic, RefreshCw, Trash2, Underline } from "lucide-react"
import type { DesignStore } from "./editor/createDesignStore"
import { MAX_FONT_SIZE, MIN_FONT_SIZE, MIN_PHOTO_SIZE } from "./editor/geometry"
import type { PersonalizationElement, TextElement } from "./editor/types"
import { resolveFont, weightLabels } from "./editor/fontCatalog"

import FontPicker from "./FontPicker"

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  return <label className="pz-control"><span>{label}</span><input type="number" aria-label={label} min={min} max={max} step="any" value={draft ?? Math.round(value * 10) / 10}
    onFocus={event => setDraft(event.target.value)} onBlur={() => setDraft(null)}
    onChange={event => { setDraft(event.target.value); if (event.target.value !== "") onChange(event.target.valueAsNumber) }} /></label>
}
function RangeControl({ label, value, min = 0, max, unit, step = 1, onChange }: { label: string; value: number; min?: number; max: number; unit: string; step?: number; onChange: (value: number) => void }) {
  const display = Math.round(value * 100) / 100
  return <label className="pz-control"><span>{label}<span>{display}{unit}</span></span><input type="range" aria-label={label} aria-valuetext={`${display}${unit}`} min={min} max={max} step={step} value={value} onChange={event => onChange(event.target.valueAsNumber)} /></label>
}

export default function PersonalizerToolControls({ element, store, onReplacePhoto, busy, available }: { element: PersonalizationElement; store: DesignStore; onReplacePhoto: () => void; busy: boolean; available: boolean }) {
  const pointerGesture = useRef(false)
  const font = element.type === "text" ? resolveFont(element.fontFamily) : null
  useEffect(() => {
    const finish = () => { if (pointerGesture.current) { pointerGesture.current = false; store.commit() } }
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
    window.addEventListener("blur", finish)
    return () => { finish(); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", finish); window.removeEventListener("blur", finish) }
  }, [store])
  return <fieldset className="pz-tool-controls" disabled={!available} aria-describedby="pz-tools-notice"
    onFocusCapture={event => { if (event.target.matches('input:not([type="checkbox"]),textarea')) store.begin() }}
    onBlurCapture={() => store.commit()}
    onPointerDownCapture={event => { if (event.target instanceof HTMLInputElement && event.target.type === "range") { pointerGesture.current = true; store.begin() } }}
    onKeyDownCapture={event => { if (event.target instanceof HTMLInputElement && event.target.type === "range") store.begin() }}
    onKeyUpCapture={event => { if (event.target instanceof HTMLInputElement && event.target.type === "range") store.commit() }}>
    <legend className="sr-only">Ferramentas de {element.type === "photo" ? "fotografia" : "texto"}</legend>
    <p className="pz-control-heading">Conteúdo</p>
    {element.type === "photo" && <div className="pz-control-row"><button type="button" className="pz-button" disabled={busy} onClick={onReplacePhoto}><RefreshCw size={13} /> Substituir</button><button type="button" className="pz-button" disabled><Crop size={13} /> Recortar</button></div>}
    {element.type === "text" && <>
      <label className="pz-control"><span>Editar conteúdo</span><textarea placeholder="O teu texto" rows={2} maxLength={600} value={element.content} onChange={event => store.updateText(element.id, { content: event.target.value })} /></label>
      <p className="pz-control-heading">Tipografia</p>
      <FontPicker value={element.fontFamily} disabled={!available} onChange={fontFamily => store.updateText(element.id, { fontFamily })} />
      <div className="pz-control-row">
        <label className="pz-control"><span>Peso</span><select aria-label="Peso da fonte" disabled={font!.weights.length === 1} value={element.fontWeight} onChange={event => store.updateText(element.id, { fontWeight: Number(event.target.value) })}>{font!.weights.map(weight => <option key={weight} value={weight}>{weightLabels[weight]}</option>)}</select></label>
        <NumberControl label="Tamanho da fonte" value={element.fontSize} min={MIN_FONT_SIZE} max={MAX_FONT_SIZE} onChange={fontSize => store.updateText(element.id, { fontSize })} />
      </div>
      <div className="pz-control"><span>Estilo</span><div className="pz-alignment" role="group" aria-label="Estilo do texto">
        <button type="button" className="pz-icon-button" aria-label="Negrito" title={font!.weights.length === 1 ? "Esta fonte possui apenas o peso Regular" : "Negrito"} disabled={font!.weights.length === 1} aria-pressed={element.fontWeight >= 600} onClick={() => store.updateText(element.id, { fontWeight: element.fontWeight >= 600 ? 400 : 700 })}><Bold size={16} /></button>
        <button type="button" className="pz-icon-button" aria-label="Itálico" title={font!.italic ? "Itálico" : "Esta fonte não possui itálico"} disabled={!font!.italic} aria-pressed={element.fontStyle === "italic"} onClick={() => store.updateText(element.id, { fontStyle: element.fontStyle === "italic" ? "normal" : "italic" })}><Italic size={16} /></button>
        <button type="button" className="pz-icon-button" aria-label="Sublinhado" aria-pressed={element.underline} onClick={() => store.updateText(element.id, { underline: !element.underline })}><Underline size={16} /></button>
      </div></div>
      <RangeControl label="Ajustar tamanho da fonte" value={element.fontSize} min={MIN_FONT_SIZE} max={MAX_FONT_SIZE} unit="" onChange={fontSize => store.updateText(element.id, { fontSize })} />
      <p className="pz-control-heading">Espaçamento</p>
      <RangeControl label="Espaçamento entre letras" value={element.letterSpacing} min={-5} max={30} step={.5} unit="" onChange={letterSpacing => store.updateText(element.id, { letterSpacing })} />
      <RangeControl label="Espaçamento entre linhas" value={element.lineHeight} min={.8} max={2} step={.05} unit="×" onChange={lineHeight => store.updateText(element.id, { lineHeight })} />
    </>}
    <p className="pz-control-heading">Transformação</p>
    {element.type === "photo" && <>
      <div className="pz-control-row"><NumberControl label="Largura" value={element.width} min={MIN_PHOTO_SIZE} max={1024} onChange={value => store.resizeElement(element.id, "width", value)} /><NumberControl label="Altura" value={element.height} min={MIN_PHOTO_SIZE} max={512} onChange={value => store.resizeElement(element.id, "height", value)} /></div>
      <label className="pz-aspect-lock"><input type="checkbox" checked={element.lockAspectRatio} onChange={event => store.setAspectLock(element.id, event.target.checked)} /> Manter proporção</label>
    </>}
    <RangeControl label="Rotação" value={element.rotation * 180 / Math.PI} min={-180} max={180} unit="°" onChange={degrees => store.rotateElement(element.id, degrees * Math.PI / 180)} />
    <div className="pz-control-row"><NumberControl label="Posição horizontal" value={element.x} min={0} max={1024} onChange={x => store.move(element.id, x, element.y, false)} /><NumberControl label="Posição vertical" value={element.y} min={0} max={512} onChange={y => store.move(element.id, element.x, y, false)} /></div>
    <p className="pz-control-heading">Aparência</p>
    {element.type === "photo" ? <RangeControl label="Cantos" value={element.cornerRadius} max={100} unit="%" onChange={value => store.setPhotoCorners(element.id, value)} /> : <>
      <label className="pz-control"><span>Cor</span><input type="color" value={element.color} onChange={event => store.updateText(element.id, { color: event.target.value })} /></label>
      <label className="pz-control"><span>Maiúsculas / minúsculas</span><select aria-label="Maiúsculas / minúsculas" value={element.textTransform} onChange={event => store.updateText(element.id, { textTransform: event.target.value as TextElement["textTransform"] })}><option value="none">Normal</option><option value="uppercase">MAIÚSCULAS</option><option value="lowercase">minúsculas</option></select></label>
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
