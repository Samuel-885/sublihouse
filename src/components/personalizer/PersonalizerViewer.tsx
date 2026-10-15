import { lazy, Suspense, useCallback, useImperativeHandle, useRef, useState, type Ref } from "react"
import { RotateCcw } from "lucide-react"
import type { Product } from "../../types/product"
import ProductImage from "../product/ProductImage"
import type { DesignStore } from "./editor/createDesignStore"
import type { DesignPoint } from "./editor/types"
import { getPersonalizer3DConfig } from "./3d/personalizer3dConfig"
import { useWebGLSupport } from "./3d/useWebGLSupport"
import ViewerErrorBoundary from "./3d/ViewerErrorBoundary"
import type { PersonalizerSceneHandle } from "./3d/PersonalizerScene"
import type { MugVariant } from "./mugVariants"

const PersonalizerScene = lazy(() => import("./3d/PersonalizerScene"))

export type PersonalizerViewerHandle = { getInsertionPoint: () => DesignPoint | undefined }

export default function PersonalizerViewer({ variant, product, store, editing, onAvailabilityChange, ref }: { variant: MugVariant; product: Product; store: DesignStore; editing: boolean; onAvailabilityChange: (available: boolean) => void; ref?: Ref<PersonalizerViewerHandle> }) {
  const config = getPersonalizer3DConfig(product)
  const supported = useWebGLSupport(Boolean(config))
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const scene = useRef<PersonalizerSceneHandle>(null)
  const onError = useCallback(() => { setFailed(true); onAvailabilityChange(false) }, [onAvailabilityChange])
  const onReady = useCallback(() => { setReady(true); onAvailabilityChange(true) }, [onAvailabilityChange])
  const show3D = Boolean(config && supported && !failed)
  useImperativeHandle(ref, () => ({
    getInsertionPoint: () => show3D && ready ? scene.current?.getInsertionPoint() : undefined,
  }), [show3D, ready])
  const unavailable = Boolean(config && (!supported || failed))
  const fallback = <div className="pz-product-image"><ProductImage product={product} loading="eager" /></div>

  return <figure className="pz-viewer" aria-label={`Pré-visualização de ${product.name}`}>
    <div className="pz-viewer-surface">
      <span className="pz-viewer-label">{show3D && ready ? "Pré-visualização 3D" : "Pré-visualização"}</span>
      {show3D && config ? <ViewerErrorBoundary onError={onError}>
        <Suspense fallback={fallback}>
          <PersonalizerScene variant={variant} ref={scene} config={config} store={store} editing={editing} onReady={onReady} onError={onError} />
        </Suspense>
      </ViewerErrorBoundary> : fallback}
      {unavailable && <p className="pz-viewer-notice" role="status">A pré-visualização 3D não está disponível neste dispositivo.</p>}
    </div>
    <figcaption className="pz-viewer-caption"><span>{show3D && ready ? "Arrasta para mover · Vazio para girar" : "Imagem do produto"}</span><button className="pz-button pz-reset" type="button" disabled={!show3D || !ready} onClick={() => scene.current?.resetView()}><RotateCcw size={12} /> Repor vista</button></figcaption>
  </figure>
}
