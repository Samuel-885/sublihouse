import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, Crop, RefreshCw, Trash2 } from "lucide-react"
import type { DesignStore } from "./editor/createDesignStore"
import type { PersonalizationElement, TextElement } from "./editor/types"

function RangePreview({ label, value }: { label: string; value: string }) {
  return <label className="pz-control"><span>{label}<span>{value}</span></span><input type="range" aria-label={label} disabled defaultValue={0} /></label>
}

export default function PersonalizerToolControls({ element, store, onReplacePhoto, busy, available }: { element: PersonalizationElement; store: DesignStore; onReplacePhoto: () => void; busy: boolean; available: boolean }) {
  return <fieldset className="pz-tool-controls" disabled={!available} aria-describedby="pz-tools-notice">
    <legend className="sr-only">Ferramentas de {element.type === "photo" ? "fotografia" : "texto"}</legend>
    {element.type === "photo" && <div className="pz-control-row"><button type="button" className="pz-button" disabled={busy} onClick={onReplacePhoto}><RefreshCw size={13} /> Substituir</button><button type="button" className="pz-button" disabled><Crop size={13} /> Recortar</button></div>}
    {element.type === "text" && <>
      <label className="pz-control"><span>Editar conteúdo</span><textarea placeholder="O teu texto" rows={2} maxLength={600} value={element.content} onChange={event => store.updateText(element.id, { content: event.target.value })} /></label>
      <label className="pz-control"><span>Fonte</span><select value={element.font} onChange={event => store.updateText(element.id, { font: event.target.value as TextElement["font"] })}>{["Figtree", "Arial", "Georgia"].map(font => <option key={font}>{font}</option>)}</select></label>
    </>}
    <RangePreview label="Tamanho" value="—" />
    {element.type === "text" && <>
      <label className="pz-control"><span>Cor</span><input type="color" value={element.color} onChange={event => store.updateText(element.id, { color: event.target.value })} /></label>
      <div className="pz-control"><span>Alinhamento</span><div className="pz-alignment">{([
        ["left", "Alinhar à esquerda", AlignLeft], ["center", "Centrar texto", AlignCenter], ["right", "Alinhar à direita", AlignRight],
      ] as const).map(([align, label, Icon]) => <button key={align} type="button" className="pz-icon-button" aria-label={label} aria-pressed={element.align === align} onClick={() => store.updateText(element.id, { align })}><Icon size={16} /></button>)}</div></div>
    </>}
    <RangePreview label="Rotação" value="—" />
    <div className="pz-control"><span>Camada</span><div className="pz-control-row"><button type="button" className="pz-button" disabled><ArrowUp size={13} /> Trazer para frente</button><button type="button" className="pz-button" disabled><ArrowDown size={13} /> Enviar para trás</button></div></div>
    <div className="pz-control-row"><button type="button" className="pz-button" disabled><Copy size={13} /> Duplicar</button><button type="button" className="pz-button pz-delete" disabled={busy} onClick={() => store.remove(element.id)}><Trash2 size={13} /> Apagar</button></div>
  </fieldset>
}
