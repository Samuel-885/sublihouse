import { lazy, Suspense, useCallback, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import type { Product } from "../../types/product"
import ProductImage from "../product/ProductImage"

import { getPersonalizer3DConfig } from "./3d/personalizer3dConfig"
import { useWebGLSupport } from "./3d/useWebGLSupport"
import ViewerErrorBoundary from "./3d/ViewerErrorBoundary"
import type { PersonalizerSceneHandle } from "./3d/PersonalizerScene"

const PersonalizerScene = lazy(() => import("./3d/PersonalizerScene"))

export default function PersonalizerViewer({ product }: { product: Product }) {
  const config = getPersonalizer3DConfig(product)
  const supported = useWebGLSupport(Boolean(config))
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const scene = useRef<PersonalizerSceneHandle>(null)
  const onError = useCallback(() => setFailed(true), [])
  const onReady = useCallback(() => setReady(true), [])
  const show3D = Boolean(config && supported && !failed)
  const unavailable = Boolean(config && (!supported || failed))
  const fallback = <div className="pz-product-image"><ProductImage product={product} loading="eager" /></div>

  return <figure className="pz-viewer" aria-label={`Pré-visualização de ${product.name}`}>
    <div className="pz-viewer-surface">
      <span className="pz-viewer-label">{show3D && ready ? "Pré-visualização 3D · Exemplo" : "Pré-visualização"}</span>
      {show3D && config ? <ViewerErrorBoundary onError={onError}>
        <Suspense fallback={fallback}>
          <PersonalizerScene ref={scene} config={config} onReady={onReady} onError={onError} />
        </Suspense>
      </ViewerErrorBoundary> : fallback}
      {unavailable && <p className="pz-viewer-notice" role="status">A pré-visualização 3D não está disponível neste dispositivo.</p>}
    </div>
    <figcaption className="pz-viewer-caption"><span>{show3D && ready ? "Arrasta para girar · Arte de exemplo" : "Imagem do produto"}</span><button className="pz-button pz-reset" type="button" disabled={!show3D || !ready} onClick={() => scene.current?.resetView()}><RotateCcw size={12} /> Repor vista</button></figcaption>
  </figure>
}
