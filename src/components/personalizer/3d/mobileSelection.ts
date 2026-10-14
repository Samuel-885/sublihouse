import { CylinderGeometry, Mesh, Raycaster, Vector2, Vector3, type Camera, type Scene } from "three"
import { selectionHandles, toDesign, unwrapDelta } from "../editor/geometry"
import { DESIGN_HEIGHT, DESIGN_WIDTH, type PersonalizationDesign } from "../editor/types"
import { MOBILE_HANDLES } from "./personalizer3dConfig"
import { pickPrintablePoint } from "./printableSurface"

type Viewport = { width: number; height: number }

/** CSS-pixel controls shared by drawing and picking. Only visible print anchors
 * participate: hidden/back-facing handles never steal a surface gesture. */
export function projectMobileHandles(design: PersonalizationDesign, camera: Camera, scene: Scene, viewport: Viewport) {
  const element = design.elements.find(item => item.id === design.selectedElementId)
  const surface = scene.getObjectByName("printable-surface")
  if (!element || !(surface instanceof Mesh) || !(surface.geometry instanceof CylinderGeometry)) return []
  const { radiusTop, height, thetaStart, thetaLength } = surface.geometry.parameters
  const ray = new Raycaster()
  scene.updateMatrixWorld()
  camera.updateMatrixWorld()
  const project = (local: { x: number; y: number }) => {
    const point = toDesign(element, local)
    const angle = thetaStart + point.x / DESIGN_WIDTH * thetaLength
    const world = surface.localToWorld(new Vector3(radiusTop * Math.sin(angle), (.5 - point.y / DESIGN_HEIGHT) * height, radiusTop * Math.cos(angle)))
    const ndc = world.project(camera)
    return { point, ndc, x: (ndc.x + 1) * viewport.width / 2, y: (1 - ndc.y) * viewport.height / 2 }
  }
  const top = project({ x: 0, y: -element.height / 2 })
  return selectionHandles(element, design.space).flatMap(handle => {
    const anchor = project(handle)
    if (Math.abs(anchor.ndc.x) > 1 || Math.abs(anchor.ndc.y) > 1 || Math.abs(anchor.ndc.z) > 1) return []
    ray.setFromCamera(new Vector2(anchor.ndc.x, anchor.ndc.y), camera)
    const hit = pickPrintablePoint(ray, scene)
    if (!hit || Math.hypot(unwrapDelta(hit.x, anchor.point.x), hit.y - anchor.point.y) > 3) return []
    let x = anchor.x, y = anchor.y
    if (handle.kind === "rotate") {
      const dx = x - top.x, dy = y - top.y, length = Math.hypot(dx, dy)
      if (length > 0) {
        const gap = Math.max(length, MOBILE_HANDLES.rotationGap)
        x = top.x + dx / length * gap
        y = top.y + dy / length * gap
      }
    }
    // Keep the whole touch target in the viewer, including at the print edge.
    const radius = MOBILE_HANDLES.touchDiameter / 2
    x = Math.max(radius, Math.min(viewport.width - radius, x))
    y = Math.max(radius, Math.min(viewport.height - radius, y))
    return [{ kind: handle.kind, x, y, anchorX: anchor.x, anchorY: anchor.y, point: anchor.point, top }]
  })
}

export function hitMobileHandle(handles: ReturnType<typeof projectMobileHandles>, x: number, y: number) {
  const distance = (handle: { x: number; y: number }) => Math.hypot(x - handle.x, y - handle.y)
  return handles.filter(handle => distance(handle) <= MOBILE_HANDLES.touchDiameter / 2)
    .sort((a, b) => a.kind === "rotate" ? -1 : b.kind === "rotate" ? 1 : distance(a) - distance(b))[0]
}
