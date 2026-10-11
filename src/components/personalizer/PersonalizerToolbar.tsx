import { Image, Plus, Redo2, Shapes, Type, Undo2 } from "lucide-react"
import type { PersonalizerTool } from "./types"

const tools = [
  { id: "photo", label: "Foto", icon: Image },
  { id: "text", label: "Texto", icon: Type },
  { id: "element", label: "Elemento", icon: Shapes },
] as const

export default function PersonalizerToolbar({ activeTool, onSelect }: { activeTool: PersonalizerTool; onSelect: (tool: PersonalizerTool) => void }) {
  return <div className="pz-toolbar" role="group" aria-label="Ferramentas de personalização">
    <div className="pz-tools">{tools.map(({ id, label, icon: Icon }) => <button key={id} className="pz-tool" type="button" aria-label={`Adicionar ${label.toLowerCase()}`} aria-pressed={activeTool === id} aria-controls="pz-panel-content" onClick={() => onSelect(id)}><Plus size={13} /><Icon size={15} /><span><span className="pz-tool-long">Adicionar </span>{label}</span></button>)}</div>
    <div className="pz-history" role="group" aria-label="Histórico">
      <button className="pz-icon-button" type="button" aria-label="Desfazer" disabled><Undo2 size={16} /></button>
      <button className="pz-icon-button" type="button" aria-label="Refazer" disabled><Redo2 size={16} /></button>
    </div>
  </div>
}
