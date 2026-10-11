import type { ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { personalizerToolLabels, type PersonalizerTool } from "./types"

export default function PersonalizerBottomSheet({ activeTool, expanded, onToggle, children }: { activeTool: PersonalizerTool; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return <aside className="pz-panel-shell" data-expanded={expanded} aria-label="Painel de personalização">
    <button type="button" className="pz-sheet-toggle" aria-expanded={expanded} aria-controls="pz-panel-content" onClick={onToggle}>
      <span className="pz-sheet-handle" aria-hidden="true" /><span>{personalizerToolLabels[activeTool]}</span>
      <span className="pz-sheet-action">{expanded ? "Recolher" : "Expandir"}{expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
    </button>
    <div id="pz-panel-content" className="pz-panel-content">{children}</div>
  </aside>
}
