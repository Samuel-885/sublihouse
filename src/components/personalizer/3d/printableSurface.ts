import { Mesh, type Object3D, type Raycaster } from "three"
import { uvToDesign } from "../editor/geometry"

/** Both insertion and manipulation respect the nearest visible physical mesh. */
export function pickPrintablePoint(raycaster: Raycaster, scene: Object3D) {
  const hit = raycaster.intersectObjects(scene.children, true).find(({ object }) => {
    if (!(object instanceof Mesh) || object.name === "selection-overlay") return false
    for (let node: Object3D | null = object; node; node = node.parent) if (!node.visible) return false
    return true
  })
  return hit?.object.name === "printable-surface" && hit.uv && Number.isFinite(hit.uv.x) && Number.isFinite(hit.uv.y)
    ? uvToDesign(hit.uv) : undefined
}
