import { useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore, type ComponentRef, type Ref } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import ProductModel from "./ProductModel"
import type { Personalizer3DConfig } from "./personalizer3dConfig"
import type { DesignStore } from "../editor/createDesignStore"
import { useDesignInteraction } from "./useDesignInteraction"

export type PersonalizerSceneHandle = { resetView: () => void }
type SceneProps = { config: Personalizer3DConfig; store: DesignStore; editing: boolean; ref: Ref<PersonalizerSceneHandle>; onReady: () => void; onError: () => void }

const motionQuery = "(prefers-reduced-motion: reduce)"
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches

function SceneContent({ config, store, editing, ref, onReady, onError }: SceneProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree(state => state.camera)
  const gl = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true)
  const [interacted, setInteracted] = useState(false)
  const [controlsVersion, setControlsVersion] = useState(0)
  const autoRotate = !interacted && !editing && !reducedMotion
  const onInteraction = useCallback(() => {
    if (controls.current) controls.current.autoRotate = false
    setInteracted(true)
  }, [])
  useDesignInteraction(store, editing, controls, onInteraction)
  useEffect(() => store.subscribe(() => {
    if (store.getDesign().elements.length) onInteraction()
  }), [store, onInteraction])

  useImperativeHandle(ref, () => ({
    resetView() {
      setInteracted(true)
      // Recreate only the lightweight controls to discard any pending damping.
      camera.position.set(...config.camera.position)
      camera.lookAt(...config.camera.target)
      setControlsVersion(version => version + 1)
      invalidate()
    },
  }), [camera, config, invalidate])

  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onError() }
    canvas.addEventListener("webglcontextlost", lost)
    onReady()
    return () => canvas.removeEventListener("webglcontextlost", lost)
  }, [gl, onReady, onError])

  // Drei updates controls in the render loop. After interaction only control
  // changes/resize request frames, including damping until settled.
  useFrame(() => { if (autoRotate) invalidate() })

  return <>
    <hemisphereLight args={["#ffffff", "#c9c2b5", 2.1]} />
    <directionalLight position={[3, 5, 4]} intensity={2.6} />
    <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#fff1e7" />
    <ProductModel config={config} store={store} />
    <OrbitControls
      key={controlsVersion}
      ref={controls}
      makeDefault
      target={config.camera.target}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.65}
      zoomSpeed={0.6}
      minDistance={config.controls.minDistance}
      maxDistance={config.controls.maxDistance}
      minPolarAngle={config.controls.minPolarAngle}
      maxPolarAngle={config.controls.maxPolarAngle}
      autoRotate={autoRotate}
      autoRotateSpeed={config.controls.autoRotateSpeed}
      onStart={() => setInteracted(true)}
    />
  </>
}

export default function PersonalizerScene(props: SceneProps) {
  return <div className="pz-scene" role="img" aria-label="Caneca 3D. Arrasta uma fotografia ou texto para mover; arrasta uma área vazia para girar. Usa dois dedos ou a roda do rato para ampliar.">
    <Canvas
      camera={{ position: props.config.camera.position, fov: props.config.camera.fov, near: 0.1, far: 40 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <SceneContent {...props} />
    </Canvas>
  </div>
}
