import type { Product } from "../../../types/product"

type Vector3Tuple = [number, number, number]

export type Personalizer3DConfig = {
  kind: "mug"
  camera: { position: Vector3Tuple; target: Vector3Tuple; fov: number }
  controls: { minDistance: number; maxDistance: number; minPolarAngle: number; maxPolarAngle: number; autoRotateSpeed: number }
  printableArea: { textureWidth: number; textureHeight: number; wrapX: boolean }
}

const mugConfig: Personalizer3DConfig = {
  kind: "mug",
  camera: { position: [2.4, 1.8, 5.5], target: [0.24, 0, 0], fov: 35 },
  controls: { minDistance: 5.2, maxDistance: 8.5, minPolarAngle: 0.65, maxPolarAngle: 1.55, autoRotateSpeed: 0.3 },
  printableArea: { textureWidth: 1024, textureHeight: 512, wrapX: true },
}

// Product data stays unchanged. Add future models here when they are available.
export function getPersonalizer3DConfig(product: Product): Personalizer3DConfig | null {
  return product.customizable && product.category === "Canecas" ? mugConfig : null
}
