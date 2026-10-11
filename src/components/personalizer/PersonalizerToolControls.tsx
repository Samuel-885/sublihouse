import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, Crop, RefreshCw, Shapes, Trash2 } from "lucide-react"
import type { PersonalizerTool } from "./types"

function RangePreview({ label, value }: { label: string; value: string }) {
  return <label className="pz-control"><span>{label}<span>{value}</span></span><input type="range" aria-label={label} disabled defaultValue={0} /></label>
}

export default function PersonalizerToolControls({ tool }: { tool: Exclude<PersonalizerTool, "default"> }) {
  return <fieldset className="pz-tool-controls" disabled aria-describedby="pz-tools-notice">
    <legend className="sr-only">Ferramentas de {tool === "photo" ? "fotografia" : tool === "text" ? "texto" : "elemento"}</legend>
    {tool === "photo" && <div className="pz-control-row"><button type="button" className="pz-button"><RefreshCw size={13} /> Substituir</button><button type="button" className="pz-button"><Crop size={13} /> Recortar</button></div>}
    {tool === "text" && <>
      <label className="pz-control"><span>Editar conteúdo</span><textarea placeholder="O teu texto" rows={2} /></label>
      <label className="pz-control"><span>Fonte</span><select defaultValue=""><option value="">Escolher fonte</option></select></label>
    </>}
    {tool === "element" && <button type="button" className="pz-button pz-full"><Shapes size={14} /> Escolher elemento</button>}
    <RangePreview label="Tamanho" value="—" />
    {tool !== "photo" && <label className="pz-control"><span>{tool === "element" ? "Cor (quando aplicável)" : "Cor"}</span><select defaultValue=""><option value="">Escolher cor</option></select></label>}
    {tool === "text" && <div className="pz-control"><span>Alinhamento</span><div className="pz-alignment"><button type="button" className="pz-icon-button" aria-label="Alinhar à esquerda"><AlignLeft size={16} /></button><button type="button" className="pz-icon-button" aria-label="Centrar texto"><AlignCenter size={16} /></button><button type="button" className="pz-icon-button" aria-label="Alinhar à direita"><AlignRight size={16} /></button></div></div>}
    <RangePreview label="Rotação" value="—" />
    <div className="pz-control"><span>Camada</span><div className="pz-control-row"><button type="button" className="pz-button"><ArrowUp size={13} /> Trazer para frente</button><button type="button" className="pz-button"><ArrowDown size={13} /> Enviar para trás</button></div></div>
    <div className="pz-control-row"><button type="button" className="pz-button"><Copy size={13} /> Duplicar</button><button type="button" className="pz-button pz-delete"><Trash2 size={13} /> Apagar</button></div>
  </fieldset>
}
