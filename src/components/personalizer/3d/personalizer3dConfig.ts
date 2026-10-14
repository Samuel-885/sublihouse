import type { Product } from "../../../types/product"

type Vector3Tuple = [number, number, number]

// Keep in sync with the stacked editor layout in personalizer.css.
export const MOBILE_EDITOR_QUERY = "(max-width: 1023px)"
export const MOBILE_HANDLES = { resizeSize: 18, rotateSize: 22, touchDiameter: 44, rotationGap: 48 } as const

export type Personalizer3DConfig = {
  kind: "mug"
  camera: { position: Vector3Tuple; target: Vector3Tuple; fov: number }
  controls: { minDistance: number; mobileMinDistance: number; maxDistance: number; minPolarAngle: number; maxPolarAngle: number; autoRotateSpeed: number }
  printableArea: { textureWidth: number; textureHeight: number; wrapX: boolean }
}

const mugConfig: Personalizer3DConfig = {
  kind: "mug",
  camera: { position: [2.4, 1.8, 5.5], target: [0.24, 0, 0], fov: 35 },
  // 2.6 leaves the camera/near plane outside the complete mug (including its
  // handle) at every allowed orbit angle. Desktop keeps its existing framing.
  controls: { minDistance: 5.2, mobileMinDistance: 2.6, maxDistance: 8.5, minPolarAngle: 0.65, maxPolarAngle: 1.55, autoRotateSpeed: 0.3 },
  printableArea: { textureWidth: 1024, textureHeight: 512, wrapX: true },
}

// Product data stays unchanged. Add future models here when they are available.
export function getPersonalizer3DConfig(product: Product): Personalizer3DConfig | null {
  return product.customizable && product.category === "Canecas" ? mugConfig : null
}
