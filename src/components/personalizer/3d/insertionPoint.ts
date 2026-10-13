import { Raycaster, Vector2, type Camera, type Object3D } from "three"
import { pickPrintablePoint } from "./printableSurface"
import type { DesignPoint } from "../editor/types"

/** Read the visible print at insertion time; never retain camera state in the design. */
export function getInsertionPoint(camera: Camera, scene: Object3D): DesignPoint | undefined {
  const surface = scene.getObjectByName("printable-surface")
  if (!surface) return undefined
  scene.updateMatrixWorld(true)
  camera.updateMatrixWorld(true)
  const raycaster = new Raycaster()
  // NDC center first, then a small ring for views where the center misses print.
  const samples = [[0, 0], [0, -0.15], [-0.15, 0], [0.15, 0], [0, 0.15],
    [-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]
  for (const [x, y] of samples) {
    raycaster.setFromCamera(new Vector2(x, y), camera)
    const point = pickPrintablePoint(raycaster, scene)
    if (point) return point
  }
  return undefined
}
